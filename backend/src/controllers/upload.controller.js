const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ── Graceful model imports (won't crash if PG is down) ────────────────────────
let QuizScore, Student, ExtractedData, sequelize;
let pgAvailable = false;

try {
  const models = require('../models');
  QuizScore     = models.QuizScore;
  Student       = models.Student;
  ExtractedData = models.ExtractedData;
  const db      = require('../../config/database');
  sequelize     = db.sequelize;
  pgAvailable   = true;
} catch (e) {
  console.warn('⚠️  Models not loaded (PostgreSQL may be down):', e.message);
}

// ── PDF / CSV services (optional) ────────────────────────────────────────────
let PDFExtractionService, DataNormalizationService;
try {
  PDFExtractionService     = require('../services/pdfExtraction.service');
  DataNormalizationService = require('../services/dataNormalization.service');
} catch (e) {
  console.warn('⚠️  PDF/CSV services not loaded:', e.message);
}

// ── KEY HELPER ────────────────────────────────────────────────────────────────
// Strip ALL whitespace and uppercase.
// "IT 23 1458 70" → "IT23145870"  (file format → what student types)
const normalizeStudentId = (val) =>
  String(val || '').replace(/\s+/g, '').toUpperCase();

// ── Helper: is Postgres alive? ────────────────────────────────────────────────
async function isPostgresUp() {
  if (!pgAvailable || !sequelize) return false;
  try { await sequelize.authenticate(); return true; }
  catch { return false; }
}

// ── Helper: safe ExtractedData create ────────────────────────────────────────
async function createExtractionRecord(data) {
  if (!(await isPostgresUp())) {
    return { id: 'no-pg-' + Date.now(), update: async () => {} };
  }
  return ExtractedData.create(data);
}

// ── Helper: normalize the ID field inside a row object ───────────────────────
function normalizeRowId(row) {
  const knownFields = [
    'Registration No', 'studentNumber', 'student_number',
    'StudentNumber', 'regNo', 'reg_no', 'id'
  ];
  const updated = { ...row };
  for (const f of knownFields) {
    if (updated[f] !== undefined && String(updated[f]).trim() !== '') {
      updated[f] = normalizeStudentId(updated[f]);
      break;
    }
  }
  return updated;
}

// ── Helper: find a student's row from normalized rows ────────────────────────
function findStudentRow(normalizedRows, studentId) {
  if (!studentId) return null;
  const target = normalizeStudentId(studentId);
  return normalizedRows.find(row => {
    const val =
      row['Registration No'] || row['studentNumber'] || row['student_number'] ||
      row['StudentNumber']   || row['regNo']         || row['reg_no']         || '';
    return normalizeStudentId(val) === target;
  }) || null;
}

class UploadController {

  // ── Main upload handler ─────────────────────────────────────────────────────
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded.' }
        });
      }

      // ✅ FIX: Accept studentId sent via FormData so the processor can locate
      // that student's row and return it directly — no slice(0,N) guessing.
      const studentId = normalizeStudentId(req.body?.studentId || '');

      const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      let result;

      switch (fileExt) {
        case 'csv':
          result = await this.processCSV(req.file, studentId, req.body);
          break;
        case 'pdf':
          result = await this.processPDF(req.file, studentId, req.body);
          break;
        case 'xls':
        case 'xlsx':
          result = await this.processExcel(req.file, studentId, req.body);
          break;
        default:
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            error: {
              code: 'UNSUPPORTED_FILE',
              message: 'Only CSV, PDF, XLS, and XLSX files are supported.'
            }
          });
      }

      return res.json({
        success: true,
        data: result,
        message: `File processed successfully. ${result.recordsCount} records extracted.`
      });

    } catch (error) {
      console.error('Upload error:', error);
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: error.message }
      });
    }
  }

  // ── Process CSV ─────────────────────────────────────────────────────────────
  async processCSV(file, studentId = '', formData = {}) {
    const extractionRecord = await createExtractionRecord({
      fileName: file.originalname, fileType: 'csv',
      filePath: file.path, status: 'processing',
      metadata: { size: file.size }
    });

    try {
      const workbook = XLSX.readFile(file.path, { type: 'file' });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

      const normalizedRows = rows.map(normalizeRowId);
      const savedRecords   = await this.saveRows(normalizedRows, file.path, formData);

      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      await extractionRecord.update({
        status: 'completed', processedAt: new Date(),
        recordCount: savedRecords.length, normalizedRecords: normalizedRows
      });

      // ✅ Find the requesting student's specific row — no arbitrary slice
      const studentRow = findStudentRow(normalizedRows, studentId);

      return {
        recordsCount: savedRecords.length,
        extractionId: extractionRecord.id,
        studentFound: !!studentRow,
        preview: studentRow ? [studentRow] : normalizedRows.slice(0, 5)
      };
    } catch (error) {
      await extractionRecord.update({ status: 'failed', metadata: { error: error.message } });
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  // ── Process PDF ─────────────────────────────────────────────────────────────
  async processPDF(file, studentId = '', formData = {}) {
    if (!PDFExtractionService || !DataNormalizationService) {
      throw new Error('PDF processing service not available.');
    }

    const extractionRecord = await createExtractionRecord({
      fileName: file.originalname, fileType: 'pdf',
      filePath: file.path, status: 'processing',
      metadata: { size: file.size }
    });

    try {
      const pdfData        = await PDFExtractionService.extractFromPDF(file.path);
      const normalizedData = DataNormalizationService.normalizeData(pdfData.extractedData, 'pdf');
      const normalizedRows = normalizedData.map(normalizeRowId);
      const savedRecords   = await this.saveRows(normalizedRows, file.path, formData);

      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      await extractionRecord.update({
        status: 'completed', processedAt: new Date(),
        recordCount: savedRecords.length, normalizedRecords: normalizedRows
      });

      // ✅ Find the requesting student's specific row — no arbitrary slice
      const studentRow = findStudentRow(normalizedRows, studentId);

      return {
        recordsCount: savedRecords.length,
        extractionId: extractionRecord.id,
        studentFound: !!studentRow,
        preview: studentRow ? [studentRow] : normalizedRows.slice(0, 5)
      };
    } catch (error) {
      await extractionRecord.update({ status: 'failed', metadata: { error: error.message } });
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  // ── Process Excel (xlsx / xls) ──────────────────────────────────────────────
  async processExcel(file, studentId = '', formData = {}) {
    const extractionRecord = await createExtractionRecord({
      fileName: file.originalname, fileType: 'excel',
      filePath: file.path, status: 'processing',
      metadata: { size: file.size }
    });

    try {
      const workbook  = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];

      // Find the real header row (SLIIT sheets have title rows before headers)
      const allRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, header: 1 });
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(allRows.length, 15); i++) {
        const rowStr = allRows[i].join('|').toLowerCase();
        if (rowStr.includes('registration') || rowStr.includes('student') || rowStr.includes('reg no')) {
          headerRowIndex = i;
          break;
        }
      }

      let rows = headerRowIndex > 0
        ? XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, range: headerRowIndex })
        : XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

      rows = rows.filter(row =>
        Object.values(row).map(v => String(v).trim()).filter(v => v).length >= 2
      );

      if (rows.length === 0) {
        throw new Error('Excel file appears to be empty or has no readable data.');
      }

      const normalizedRows = rows.map(normalizeRowId);
      const savedRecords   = await this.saveRows(normalizedRows, file.path, formData);

      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      await extractionRecord.update({
        status: 'completed', processedAt: new Date(),
        recordCount: savedRecords.length, normalizedRecords: normalizedRows
      });

      // ✅ Find the requesting student's specific row — no arbitrary slice
      const studentRow = findStudentRow(normalizedRows, studentId);

      return {
        recordsCount: savedRecords.length,
        extractionId: extractionRecord.id,
        sheetName,
        studentFound: !!studentRow,
        preview: studentRow ? [studentRow] : normalizedRows.slice(0, 5)
      };
    } catch (error) {
      await extractionRecord.update({ status: 'failed', metadata: { error: error.message } });
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  // ── Save rows to DB (graceful — skips if PG is down) ─────────────────────
  async saveRows(rows, filePath, formData = {}) {
    if (!(await isPostgresUp())) {
      console.warn('⚠️  PostgreSQL down — skipping DB save');
      return rows;
    }

    const saved = [];
    for (const record of rows) {
      try {
        const rawId =
          record.studentNumber || record.student_number ||
          record.StudentNumber || record['Registration No'] ||
          record.regNo        || record.id               || null;

        const studentNumber = rawId ? normalizeStudentId(rawId) : null;
        if (!studentNumber) continue;

        const subject = record.subject || record.Subject || record.module || record.Module || record.course || record.Course || record['subject_name'] || record['Subject Name'] || 'Unknown Subject';
        const score   = parseFloat(record.score || record.Score || record['CA Marks'] || record.marks || record.Marks || record['Score (%)'] || 0);
        const type    = record.type   || record.Type   || record.assessmentType || record.AssessmentType || 'final';
        const grade   = record.grade  || record.Grade  || null;
        const status  = record.status || record.Status || null;

        const studentProgram  = record.program || record.Program || formData.courseProgram || null;
        const studentYear     = record.academicYear || record.year || formData.academicYear || null;
        const studentSemester = record.semester || record.Semester || formData.semester || null;
        const studentBranch   = record.branch || record.Branch || formData.branch || null;

        let student = await Student.findOne({ where: { studentNumber } });
        if (!student) {
          student = await Student.create({
            studentNumber,
            name:     record.name || record.Name || formData.fullName || `Student ${studentNumber}`,
            email:    (record.email || record.Email || `${studentNumber.toLowerCase()}@student.edu`),
            program:  studentProgram || null,
            year:     studentYear || null,
            semester: studentSemester || null,
            branch:   studentBranch || null,
            metadata: { source: 'file_upload' }
          });
        } else {
          // Update existing student with form data or extracted row values
          await student.update({
            name: formData.fullName || record.name || record.Name || student.name,
            email: record.email || record.Email || student.email,
            program: studentProgram || student.program,
            year: studentYear || student.year,
            semester: studentSemester || student.semester,
            branch: studentBranch || student.branch
          });
        }

        const quizScore = await QuizScore.create({
          studentId: student.id, subject, score, type,
          date: record.date || new Date(),
          sourceFile: filePath, extractedData: record,
          metadata: { grade, status }
        });
        saved.push(quizScore);
      } catch (rowError) {
        console.warn('⚠️  Skipping row:', rowError.message);
      }
    }
    return saved;
  }

  // ── Get extraction status ────────────────────────────────────────────────────
  async getExtractionStatus(req, res) {
    try {
      if (!(await isPostgresUp())) {
        return res.json({ success: true, data: null, message: 'Database unavailable' });
      }
      const extraction = await ExtractedData.findByPk(req.params.extractionId);
      if (!extraction) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Extraction not found' } });
      }
      return res.json({
        success: true,
        data: {
          id: extraction.id, fileName: extraction.fileName,
          status: extraction.status, processedAt: extraction.processedAt,
          recordCount: extraction.recordCount || 0, errors: extraction.validationErrors || []
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'STATUS_ERROR', message: error.message } });
    }
  }

  // ── Get extraction history ───────────────────────────────────────────────────
  async getExtractionHistory(req, res) {
    try {
      if (!(await isPostgresUp())) return res.json({ success: true, data: [] });
      const extractions = await ExtractedData.findAll({ order: [['createdAt', 'DESC']], limit: 50, raw: true });
      return res.json({
        success: true,
        data: extractions.map(ext => ({
          id: ext.id, fileName: ext.fileName, fileType: ext.fileType,
          status: ext.status, uploadedAt: ext.createdAt, processedAt: ext.processedAt,
          recordCount: ext.recordCount || 0, validationErrors: ext.validationErrors || []
        }))
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'HISTORY_ERROR', message: error.message } });
    }
  }

  // ── Get extraction stats ─────────────────────────────────────────────────────
  async getExtractionStats(req, res) {
    try {
      if (!(await isPostgresUp())) {
        return res.json({ success: true, data: { totalUploads: 0, successfulExtractions: 0, failedExtractions: 0, totalRecords: 0 } });
      }
      const all = await ExtractedData.findAll({ raw: true });
      return res.json({
        success: true,
        data: {
          totalUploads: all.length,
          successfulExtractions: all.filter(e => e.status === 'completed').length,
          failedExtractions: all.filter(e => e.status === 'failed').length,
          totalRecords: all.reduce((sum, e) => sum + (e.recordCount || 0), 0)
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'STATS_ERROR', message: error.message } });
    }
  }

  // ── Update extraction ────────────────────────────────────────────────────────
  async updateExtraction(req, res) {
    try {
      if (!(await isPostgresUp())) {
        return res.status(503).json({ success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } });
      }
      
      const { extractionId } = req.params;
      const { fileName, fileType, status, recordCount } = req.body;

      const extraction = await ExtractedData.findByPk(extractionId);
      if (!extraction) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Extraction not found' } });
      }

      // Update allowed fields
      if (fileName) extraction.fileName = fileName;
      if (fileType) extraction.fileType = fileType;
      if (status) extraction.status = status;
      if (recordCount !== undefined) extraction.recordCount = recordCount;

      await extraction.save();

      return res.json({
        success: true,
        message: 'Extraction updated successfully',
        data: {
          id: extraction.id,
          fileName: extraction.fileName,
          fileType: extraction.fileType,
          status: extraction.status,
          recordCount: extraction.recordCount,
          uploadedAt: extraction.createdAt
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: error.message } });
    }
  }

  // ── Delete extraction ────────────────────────────────────────────────────────
  async deleteExtraction(req, res) {
    try {
      if (!(await isPostgresUp())) return res.json({ success: true, message: 'Deleted (DB unavailable)' });
      const extraction = await ExtractedData.findByPk(req.params.extractionId);
      if (!extraction) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Extraction not found' } });
      }
      if (extraction.filePath && fs.existsSync(extraction.filePath)) fs.unlinkSync(extraction.filePath);
      await extraction.destroy();
      return res.json({ success: true, message: 'Extraction deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'DELETE_ERROR', message: error.message } });
    }
  }

  // ── Get student marks ────────────────────────────────────────────────────────
  async getStudentMarks(req, res) {
    try {
      const { studentId } = req.params;
      if (!studentId) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_PARAM', message: 'Student ID required' } });
      }
      if (!(await isPostgresUp())) return res.json({ success: true, data: { studentId, marks: [] } });

      const normalizedId = normalizeStudentId(studentId);
      const student = await Student.findOne({ where: { studentNumber: normalizedId } });
      if (!student) return res.json({ success: true, data: { studentId: normalizedId, marks: [] } });

      const marks = await QuizScore.findAll({ where: { studentId: student.id }, order: [['date', 'DESC']] });
      return res.json({
        success: true,
        data: {
          studentId: normalizedId,
          student: { id: student.id, name: student.name, number: student.studentNumber },
          marks: marks.map(m => ({ subject: m.subject, marks: m.score, assessmentType: m.type, date: m.date, id: m.id }))
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
    }
  }
}

const controller = new UploadController();

module.exports = {
  uploadFile:           controller.uploadFile.bind(controller),
  processCSV:           controller.processCSV.bind(controller),
  processPDF:           controller.processPDF.bind(controller),
  processExcel:         controller.processExcel.bind(controller),
  saveRows:             controller.saveRows.bind(controller),
  getExtractionStatus:  controller.getExtractionStatus.bind(controller),
  getExtractionHistory: controller.getExtractionHistory.bind(controller),
  getExtractionStats:   controller.getExtractionStats.bind(controller),
  updateExtraction:     controller.updateExtraction.bind(controller),
  deleteExtraction:     controller.deleteExtraction.bind(controller),
  getStudentMarks:      controller.getStudentMarks.bind(controller),
};