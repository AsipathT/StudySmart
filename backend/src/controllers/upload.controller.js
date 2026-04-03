/**
 * upload.controller.js  —  FIXED
 *
 * Bug fixes:
 * 1. saveRows: QuizScore.create now stores BOTH studentId (PG student PK) AND
 *    metadata.uploadedBy (mongoUserId) so both lookup paths work.
 * 2. getUserMarks: was querying { userId } but QuizScore has no userId column.
 *    Fixed to find the student by email/studentId then query by studentId.
 * 3. getExtractionHistory: ExtractedDataMongo rows already have 'score' field —
 *    returned as-is so AnalyticsPage rowToScore() can find it.
 */
const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ── Graceful model imports ────────────────────────────────────────────────────
let QuizScore, Student, ExtractedData, sequelize;
let ExtractedDataMongo = null;
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

try {
  ExtractedDataMongo = require('../models/ExtractedDataMongo');
} catch (e) {
  console.warn('⚠️  ExtractedData Mongo model not loaded:', e.message);
}

let PDFExtractionService, DataNormalizationService;
try {
  PDFExtractionService     = require('../services/pdfExtraction.service');
  DataNormalizationService = require('../services/dataNormalization.service');
} catch (e) {
  console.warn('⚠️  PDF/CSV services not loaded:', e.message);
}

// ── Helper: is Postgres alive? ────────────────────────────────────────────────
async function isPostgresUp() {
  if (!pgAvailable || !sequelize) return false;
  try { await sequelize.authenticate(); return true; }
  catch { return false; }
}

// ── ID normalizer ─────────────────────────────────────────────────────────────
const normalizeStudentId = (val) =>
  String(val || '').replace(/\s+/g, '').toUpperCase();

// ── Helper: safe ExtractedData create ────────────────────────────────────────
async function createExtractionRecord(data) {
  if (!(await isPostgresUp())) {
    return { id: 'no-pg-' + Date.now(), update: async () => {} };
  }
  if (!data.uploadedBy && data.metadata?.userId) {
    data.uploadedBy = data.metadata.userId;
  }
  try {
    return await ExtractedData.create(data);
  } catch (e) {
    console.warn('⚠️  ExtractedData.create failed:', e.message);
    return { id: 'no-db-' + Date.now(), update: async () => {} };
  }
}

function normalizeRowId(row) {
  const knownFields = ['Registration No','studentNumber','student_number','StudentNumber','regNo','reg_no','id'];
  const updated = { ...row };
  for (const f of knownFields) {
    if (updated[f] !== undefined && String(updated[f]).trim() !== '') {
      updated[f] = normalizeStudentId(updated[f]);
      break;
    }
  }
  return updated;
}

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

// ── Grade helpers ─────────────────────────────────────────────────────────────
function getGradeForScore(score) {
  if (score >= 85) return 'A+'; if (score >= 75) return 'A';
  if (score >= 70) return 'B+'; if (score >= 65) return 'B';
  if (score >= 60) return 'C+'; if (score >= 55) return 'C';
  if (score >= 50) return 'D';  return 'F';
}

function calculateGPA(scores = []) {
  if (!scores.length) return 0;
  const avg = scores.reduce((s, q) => s + parseFloat(q || 0), 0) / scores.length;
  return parseFloat(Math.max(0, ((avg - 40) / 60) * 4.0).toFixed(2));
}

// ═════════════════════════════════════════════════════════════════════════════
class UploadController {

  // ── Main upload handler ─────────────────────────────────────────────────────
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success:false, error:{ code:'NO_FILE', message:'No file uploaded.' } });
      }

      const studentId = normalizeStudentId(req.body?.studentId || '');
      const userId    = req.user?.id || req.user?._id?.toString() || req.body?.userId || '';
      const fileExt   = path.extname(req.file.originalname).toLowerCase().replace('.','');
      let result;

      switch (fileExt) {
        case 'csv':  result = await this.processCSV(req.file, studentId, req.body, userId); break;
        case 'pdf':  result = await this.processPDF(req.file, studentId, req.body, userId); break;
        case 'xls':
        case 'xlsx': result = await this.processExcel(req.file, studentId, req.body, userId); break;
        default:
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(400).json({ success:false, error:{ code:'UNSUPPORTED_FILE', message:'Only CSV, PDF, XLS, XLSX supported.' } });
      }

      return res.json({
        success: true, data: result,
        message: `File processed successfully. ${result.recordsCount} records extracted.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success:false, error:{ code:'UPLOAD_ERROR', message:error.message } });
    }
  }

  // ── Process CSV ─────────────────────────────────────────────────────────────
  async processCSV(file, studentId = '', formData = {}, userId = '') {
    const extractionRecord = await createExtractionRecord({
      fileName:file.originalname, fileType:'csv', filePath:file.path,
      status:'processing', metadata:{ size:file.size, userId }
    });
    try {
      const workbook = XLSX.readFile(file.path, { type:'file' });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const rows     = XLSX.utils.sheet_to_json(sheet, { defval:'', raw:false });
      const normalizedRows = rows.map(normalizeRowId);
      const savedRecords   = await this.saveRows(normalizedRows, file.path, formData, userId, 'csv');
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      await extractionRecord.update({ status:'completed', processedAt:new Date(), recordCount:savedRecords.length, normalizedRecords:normalizedRows });
      const studentRow = findStudentRow(normalizedRows, studentId);
      return { recordsCount:savedRecords.length, extractionId:extractionRecord._id||extractionRecord.id, studentFound:!!studentRow, preview:studentRow?[studentRow]:normalizedRows.slice(0,5) };
    } catch (error) {
      await extractionRecord.update({ status:'failed', metadata:{ error:error.message } });
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  // ── Process PDF ─────────────────────────────────────────────────────────────
  async processPDF(file, studentId = '', formData = {}, userId = '') {
    if (!PDFExtractionService || !DataNormalizationService) throw new Error('PDF processing service not available.');
    const extractionRecord = await createExtractionRecord({
      fileName:file.originalname, fileType:'pdf', filePath:file.path,
      status:'processing', metadata:{ size:file.size, userId }
    });
    try {
      const pdfData        = await PDFExtractionService.extractFromPDF(file.path);
      const normalizedData = DataNormalizationService.normalizeData(pdfData.extractedData, 'pdf');
      const normalizedRows = normalizedData.map(normalizeRowId);
      const savedRecords   = await this.saveRows(normalizedRows, file.path, formData, userId, 'pdf');
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      await extractionRecord.update({ status:'completed', processedAt:new Date(), recordCount:savedRecords.length, normalizedRecords:normalizedRows });
      const studentRow = findStudentRow(normalizedRows, studentId);
      return { recordsCount:savedRecords.length, extractionId:extractionRecord._id||extractionRecord.id, studentFound:!!studentRow, preview:studentRow?[studentRow]:normalizedRows.slice(0,5) };
    } catch (error) {
      await extractionRecord.update({ status:'failed', metadata:{ error:error.message } });
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  // ── Process Excel ───────────────────────────────────────────────────────────
  async processExcel(file, studentId = '', formData = {}, userId = '') {
    const extractionRecord = await createExtractionRecord({
      fileName:file.originalname, fileType:'excel', filePath:file.path,
      status:'processing', metadata:{ size:file.size, userId }
    });
    try {
      const workbook  = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];
      const allRows   = XLSX.utils.sheet_to_json(sheet, { defval:'', raw:false, header:1 });

      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(allRows.length, 15); i++) {
        const rowStr = allRows[i].join('|').toLowerCase();
        if (rowStr.includes('registration') || rowStr.includes('student') || rowStr.includes('reg no')) {
          headerRowIndex = i; break;
        }
      }

      let rows = headerRowIndex > 0
        ? XLSX.utils.sheet_to_json(sheet, { defval:'', raw:false, range:headerRowIndex })
        : XLSX.utils.sheet_to_json(sheet, { defval:'', raw:false });

      rows = rows.filter(row => Object.values(row).map(v=>String(v).trim()).filter(v=>v).length >= 2);
      if (rows.length === 0) throw new Error('Excel file appears to be empty or has no readable data.');

      const normalizedRows = rows.map(normalizeRowId);
      const savedRecords   = await this.saveRows(normalizedRows, file.path, formData, userId, 'excel');
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      await extractionRecord.update({ status:'completed', processedAt:new Date(), recordCount:savedRecords.length, normalizedRecords:normalizedRows });
      const studentRow = findStudentRow(normalizedRows, studentId);
      return { recordsCount:savedRecords.length, extractionId:extractionRecord._id||extractionRecord.id, sheetName, studentFound:!!studentRow, preview:studentRow?[studentRow]:normalizedRows.slice(0,5) };
    } catch (error) {
      await extractionRecord.update({ status:'failed', metadata:{ error:error.message } });
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  // ── Save rows ─────────────────────────────────────────────────────────────────
  // BUG FIX 2: QuizScore now stores metadata.uploadedBy = userId
  // so getStudentMarks can cross-reference via uploadedBy when needed.
  async saveRows(rows, filePath, formData = {}, userId = '', fileType = 'unknown') {
    const saved = [];
    const mongoRows = [];

    if (!(await isPostgresUp())) {
      console.warn('⚠️  PostgreSQL down — skipping DB save');
      return rows; // return raw rows so preview still works
    }

    for (const record of rows) {
      try {
        const rawId =
          record.studentNumber || record.student_number ||
          record.StudentNumber || record['Registration No'] ||
          record.regNo        || record.id               || null;
        const studentNumber = rawId ? normalizeStudentId(rawId) : null;
        if (!studentNumber) continue;

        const subject  = record.subject || record.Subject || record.module  || record.Module  || record.course || record.Course || record['subject_name'] || record['Subject Name'] || 'Unknown Subject';
        const score    = parseFloat(record.score || record.Score || record['CA Marks'] || record.marks || record.Marks || record['Score (%)'] || 0);
        const type     = record.type   || record.Type   || record.assessmentType || 'final';
        const grade    = record.grade  || record.Grade  || null;
        const status   = record.status || record.Status || null;
        const stBranch = record.branch || record.Branch || formData.branch    || null;
        const stProg   = record.program || record.Program || formData.courseProgram || null;
        const stYear   = record.academicYear || record.year || formData.academicYear || null;
        const stSem    = record.semester || record.Semester || formData.semester || null;

        let student = await Student.findOne({ where: { studentNumber } });
        if (!student) {
          student = await Student.create({
            studentNumber,
            name:     record.name || record.Name || formData.fullName || `Student ${studentNumber}`,
            email:    record.email || record.Email || `${studentNumber.toLowerCase()}@student.edu`,
            metadata: { source:'file_upload', userId, program:stProg, year:stYear, semester:stSem, branch:stBranch },
          });
        } else {
          // Merge new info into metadata
          const existing = student.metadata || {};
          await Student.update({
            name:     formData.fullName || record.name || record.Name || student.name,
            metadata: { ...existing, userId, program:stProg||existing.program, year:stYear||existing.year, semester:stSem||existing.semester, branch:stBranch||existing.branch },
          }, { where: { id: student.id } });
        }

        // BUG FIX 2: store userId in metadata so profile controller can find scores
        const quizScore = await QuizScore.create({
          studentId:     student.id,
          subject, score, type,
          date:          record.date || new Date(),
          sourceFile:    filePath,
          extractedData: record,
          metadata:      { grade, status, uploadedBy: userId, studentNumber },
        });
        saved.push(quizScore);

        mongoRows.push({
          name:          record.name || record.Name || formData.fullName || `Student ${studentNumber}`,
          studentNumber,
          subject,
          score:         Number.isNaN(score) ? 0 : score,
          grade:         grade || getGradeForScore(score),
          status:        status || (score >= 50 ? 'Pass' : 'Fail'),
          branch:        stBranch || '',
          date:          record.date ? new Date(record.date) : new Date(),
          uploadedBy:    userId || '',
          sourceFile:    filePath,
          fileName:      path.basename(filePath) || 'unknown',
          fileType:      fileType || 'unknown',
          metadata:      { ...record },
        });
      } catch (rowError) {
        console.warn('⚠️  Skipping row:', rowError.message);
      }
    }

    // Save to MongoDB
    try {
      if (ExtractedDataMongo && require('mongoose').connection.readyState === 1 && mongoRows.length > 0) {
        const inserted = await ExtractedDataMongo.insertMany(mongoRows, { ordered: false });
        console.log(`[Upload] Saved ${inserted.length} rows to MongoDB`);
      }
    } catch (mongoErr) {
      console.error('[Upload] MongoDB save error:', mongoErr.message);
    }

    return saved;
  }

  // ── Get extraction status ────────────────────────────────────────────────────
  async getExtractionStatus(req, res) {
    try {
      const extraction = await ExtractedData.findById(req.params.extractionId);
      if (!extraction) return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'Extraction not found' } });
      return res.json({ success:true, data:{
        id:extraction._id, fileName:extraction.fileName, status:extraction.status,
        processedAt:extraction.processedAt, recordCount:extraction.recordCount||0,
        errors:extraction.validationErrors||[],
      }});
    } catch (error) {
      return res.status(500).json({ success:false, error:{ code:'STATUS_ERROR', message:error.message } });
    }
  }

  // ── Get extraction history ───────────────────────────────────────────────────
  async getExtractionHistory(req, res) {
    try {
      const mongoose = require('mongoose');
      const userId   = req.user?.id;

      // BUG FIX 3: ExtractedDataMongo rows have 'score' (number) not 'CA Marks'.
      // AnalyticsPage rowToScore() now handles 'score' field — just return the rows as-is.
      if (ExtractedDataMongo && mongoose.connection.readyState === 1) {
        const query = {};
        if (req.user && req.user.role !== 'admin') query.uploadedBy = userId;

        const docs = await ExtractedDataMongo.find(query).sort({ createdAt:-1 }).limit(200).lean();
        console.log(`[History] ${docs.length} records from MongoDB for user ${userId}`);

        const payload = docs.map(doc => {
          const sourceFile = doc.sourceFile || '';
          const baseFileName = sourceFile ? path.basename(sourceFile) : 'unknown';
          const fileName = doc.fileName || baseFileName;
          const fileType = doc.fileType || (fileName && fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'unknown');
          return {
            id:            doc._id.toString(),
            _id:           doc._id,
            fileName,
            fileType,
            studentNumber: doc.studentNumber,
            subject:       doc.subject,
            score:         doc.score,
            grade:         doc.grade,
            status:        doc.status,
            branch:        doc.branch,
            date:          doc.date,
            uploadedAt:    doc.createdAt,
            processedAt:   doc.updatedAt,
            uploadedBy:    doc.uploadedBy,
            sourceFile:    doc.sourceFile,
            metadata:      doc.metadata,
          };
        });

        return res.json({ success:true, data:payload });
      }

      // PostgreSQL fallback
      if (!(await isPostgresUp())) return res.json({ success:true, data:[] });
      const where = {};
      if (req.user && req.user.role !== 'admin') where.uploadedBy = req.user.id;
      const extractions = await ExtractedData.findAll({ where, order:[['createdAt','DESC']], limit:100, raw:true });
      const payload = extractions.map(ext => ({
        id:ext.id,
        _id:ext.id,
        fileName:ext.fileName || ext.name || 'unknown',
        fileType:ext.fileType || (ext.fileName ? ext.fileName.split('.').pop().toLowerCase() : 'unknown'),
        status:ext.status,
        uploadedAt:ext.createdAt,
        processedAt:ext.processedAt,
        recordCount:ext.recordCount||0,
        validationErrors:ext.validationErrors||[],
        studentId:ext.metadata?.studentId||null,
        uploadedBy:ext.uploadedBy||ext.metadata?.userId||null,
        preview:ext.normalizedRecords||[],
      }));
      return res.json({ success:true, data:payload });
    } catch (error) {
      console.error('UploadHistory error:', error);
      return res.status(500).json({ success:false, error:{ code:'HISTORY_ERROR', message:error.message } });
    }
  }

  // ── Get extraction stats ─────────────────────────────────────────────────────
  async getExtractionStats(req, res) {
    try {
      const mongoose = require('mongoose');
      if (ExtractedDataMongo && mongoose.connection.readyState === 1) {
        const total    = await ExtractedDataMongo.countDocuments();
        const distinct = await ExtractedDataMongo.distinct('sourceFile');
        return res.json({ success:true, data:{
          totalUploads: distinct.length || total,
          successfulExtractions: distinct.length || total,
          failedExtractions: 0,
          totalRecords: total,
        }});
      }
      const all = await ExtractedData.findAll({ raw:true });
      return res.json({ success:true, data:{
        totalUploads: all.length,
        successfulExtractions: all.filter(e=>e.status==='completed').length,
        failedExtractions: all.filter(e=>e.status==='failed').length,
        totalRecords: all.reduce((sum,e)=>sum+(e.recordCount||0),0),
      }});
    } catch (error) {
      return res.status(500).json({ success:false, error:{ code:'STATS_ERROR', message:error.message } });
    }
  }

  // ── Update extraction ────────────────────────────────────────────────────────
  async updateExtraction(req, res) {
    try {
      const extraction = await ExtractedData.findById(req.params.extractionId);
      if (!extraction) return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'Not found' } });
      const { fileName, fileType, status, recordCount } = req.body;
      if (fileName)              extraction.fileName    = fileName;
      if (fileType)              extraction.fileType    = fileType;
      if (status)                extraction.status      = status;
      if (recordCount !== undefined) extraction.recordCount = recordCount;
      await extraction.save();
      return res.json({ success:true, message:'Extraction updated', data:{ id:extraction._id, fileName:extraction.fileName, status:extraction.status } });
    } catch (error) {
      return res.status(500).json({ success:false, error:{ code:'UPDATE_ERROR', message:error.message } });
    }
  }

  // ── Delete extraction ────────────────────────────────────────────────────────
  async deleteExtraction(req, res) {
    try {
      const extraction = await ExtractedData.findById(req.params.extractionId);
      if (!extraction) return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'Not found' } });
      if (extraction.filePath && fs.existsSync(extraction.filePath)) fs.unlinkSync(extraction.filePath);
      await extraction.deleteOne();
      return res.json({ success:true, message:'Extraction deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success:false, error:{ code:'DELETE_ERROR', message:error.message } });
    }
  }

  // ── Get student marks by studentId param ─────────────────────────────────────
  async getStudentMarks(req, res) {
    try {
      const { studentId } = req.params;
      if (!studentId) return res.status(400).json({ success:false, error:{ code:'MISSING_PARAM', message:'Student ID required' } });
      const normalizedId = normalizeStudentId(studentId);

      // Try MongoDB first (faster)
      const mongoose = require('mongoose');
      if (ExtractedDataMongo && mongoose.connection.readyState === 1) {
        const docs = await ExtractedDataMongo.find({ studentNumber: normalizedId }).sort({ date:-1 }).lean();
        return res.json({
          success:true,
          data:{
            studentId: normalizedId,
            marks: docs.map(d=>({ subject:d.subject, marks:d.score, grade:d.grade, status:d.status, date:d.date, id:d._id })),
          },
        });
      }

      if (!(await isPostgresUp())) return res.json({ success:true, data:{ studentId:normalizedId, marks:[] } });
      const student = await Student.findOne({ where:{ studentNumber:normalizedId } });
      if (!student) return res.json({ success:true, data:{ studentId:normalizedId, marks:[] } });
      const marks = await QuizScore.findAll({ where:{ studentId:student.id }, order:[['date','DESC']] });
      return res.json({
        success:true,
        data:{
          studentId: normalizedId,
          student:{ id:student.id, name:student.name, number:student.studentNumber },
          marks: marks.map(m=>({ subject:m.subject, marks:m.score, assessmentType:m.type, date:m.date, id:m.id })),
        },
      });
    } catch (error) {
      return res.status(500).json({ success:false, error:{ code:'FETCH_ERROR', message:error.message } });
    }
  }

  // ── Get marks for authenticated user ─────────────────────────────────────────
  // BUG FIX 2: was querying { userId } — QuizScore has no userId column.
  // Now finds student by studentId stored in User model, then queries by student.id
  async getUserMarks(req, res) {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success:false, error:{ code:'UNAUTHORIZED', message:'Not authenticated' } });

      // First try MongoDB ExtractedDataMongo (fastest, no PG needed)
      const mongoose = require('mongoose');
      if (ExtractedDataMongo && mongoose.connection.readyState === 1) {
        const docs = await ExtractedDataMongo.find({ uploadedBy: userId }).sort({ date:-1 }).lean();
        if (docs.length > 0) {
          const bySubject = {};
          docs.forEach(d => {
            if (!bySubject[d.subject]) bySubject[d.subject] = [];
            bySubject[d.subject].push(parseFloat(d.score || 0));
          });
          const subjects = Object.entries(bySubject).map(([subject, scores]) => {
            const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
            return { subject, average:parseFloat(avg.toFixed(2)), max:Math.max(...scores), min:Math.min(...scores), count:scores.length, grade:getGradeForScore(avg) };
          });
          const allScores = docs.map(d=>parseFloat(d.score||0));
          const overallAvg = allScores.reduce((a,b)=>a+b,0)/allScores.length;
          return res.json({ success:true, data:{
            userId, subjects:subjects.sort((a,b)=>b.average-a.average),
            totalMarks:docs.length, averageMarks:parseFloat(overallAvg.toFixed(2)),
            gpa:calculateGPA(allScores),
            marks:docs.map(d=>({ id:d._id, subject:d.subject, score:d.score, grade:d.grade, status:d.status, date:d.date })),
          }});
        }
      }

      // PG fallback — find student via User model studentId
      if (!(await isPostgresUp())) return res.json({ success:true, data:{ userId, subjects:[], totalMarks:0, averageMarks:0, gpa:0 } });

      const User = require('../models/User');
      const mongoUser = await User.findById(userId).select('studentId email').catch(()=>null);
      if (!mongoUser) return res.json({ success:true, data:{ userId, subjects:[], totalMarks:0, averageMarks:0, gpa:0 } });

      // Find postgres student
      let student = null;
      if (mongoUser.studentId) student = await Student.findOne({ where:{ studentNumber: normalizeStudentId(mongoUser.studentId) } });
      if (!student && mongoUser.email) student = await Student.findOne({ where:{ email: mongoUser.email } });
      if (!student) return res.json({ success:true, data:{ userId, subjects:[], totalMarks:0, averageMarks:0, gpa:0 } });

      // BUG FIX 2: query by studentId (PG FK), not userId
      const marks = await QuizScore.findAll({ where:{ studentId: student.id }, order:[['date','DESC']] });
      if (!marks.length) return res.json({ success:true, data:{ userId, subjects:[], totalMarks:0, averageMarks:0, gpa:0 } });

      const bySubject = {};
      marks.forEach(m => {
        if (!bySubject[m.subject]) bySubject[m.subject] = [];
        bySubject[m.subject].push(parseFloat(m.score));
      });
      const subjects = Object.entries(bySubject).map(([subject, scores]) => {
        const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
        return { subject, average:parseFloat(avg.toFixed(2)), max:Math.max(...scores), min:Math.min(...scores), count:scores.length, grade:getGradeForScore(avg) };
      });
      const allScores = marks.map(m=>parseFloat(m.score));
      const overallAvg = allScores.reduce((a,b)=>a+b,0)/allScores.length;

      return res.json({ success:true, data:{
        userId, subjects:subjects.sort((a,b)=>b.average-a.average),
        totalMarks:marks.length, averageMarks:parseFloat(overallAvg.toFixed(2)),
        gpa:calculateGPA(allScores),
        marks:marks.map(m=>({ id:m.id, subject:m.subject, score:m.score, type:m.type, date:m.date })),
      }});
    } catch (error) {
      console.error('getUserMarks error:', error);
      return res.status(500).json({ success:false, error:{ code:'FETCH_ERROR', message:error.message } });
    }
  }

  // ── Helpers (kept for external use) ─────────────────────────────────────────
  getGradeForScore(score) { return getGradeForScore(score); }
  calculateGPA(scores)    { return calculateGPA(scores); }
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
  getUserMarks:         controller.getUserMarks.bind(controller),
  getStudentMarks:      controller.getStudentMarks.bind(controller),
};