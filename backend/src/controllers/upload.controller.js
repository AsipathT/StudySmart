const fs = require('fs');
const path = require('path');
const ExtractedData = require('../models/ExtractedData');
const PDFExtractionService = require('../services/pdfExtraction.service');
const DataNormalizationService = require('../services/dataNormalization.service');
const { QuizScore, Student } = require('../models/postgres');

class UploadController {
  /**
   * Upload and process file (PDF/CSV)
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded.' }
        });
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExt === '.pdf' ? 'pdf' : 'csv';

      // Create extraction record
      const extractionRecord = await ExtractedData.create({
        fileName: req.file.originalname,
        fileType: fileType,
        filePath: req.file.path,
        status: 'pending',
        metadata: {
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadedBy: req.user?.id
        }
      });

      // Start extraction process (async)
      this.processFile(req.file.path, fileType, extractionRecord.id);

      return res.json({
        success: true,
        data: {
          extractionId: extractionRecord.id,
          fileName: req.file.originalname,
          status: 'processing'
        },
        message: 'File uploaded successfully. Processing started.'
      });

    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: error.message }
      });
    }
  }

  /**
   * Process file asynchronously
   */
  async processFile(filePath, fileType, extractionId) {
    try {
      // Update status to processing
      await ExtractedData.update(
        { status: 'processing' },
        { where: { id: extractionId } }
      );

      let rawData;
      let normalizedData = [];

      // Extract data based on file type
      if (fileType === 'pdf') {
        const pdfData = await PDFExtractionService.extractFromPDF(filePath);
        rawData = pdfData;
        normalizedData = DataNormalizationService.normalizeData(pdfData.extractedData, 'pdf');
      } else {
        const csvData = await PDFExtractionService.extractFromCSV(filePath);
        rawData = csvData;
        normalizedData = DataNormalizationService.normalizeData(csvData, 'csv');
      }

      // Validate and save normalized data
      const savedRecords = [];
      const validationErrors = [];

      for (const record of normalizedData) {
        const validation = DataNormalizationService.validateRecord(record);
        
        if (validation.isValid) {
          // Find or create student
          let student = await Student.findOne({
            where: { studentNumber: record.studentNumber }
          });

          if (!student) {
            student = await Student.create({
              studentNumber: record.studentNumber,
              name: record.name || 'Unknown',
              email: `${record.studentNumber}@student.edu`,
              metadata: { source: 'file_upload' }
            });
          }

          // Save quiz score
          const quizScore = await QuizScore.create({
            studentId: student.id,
            subject: record.subject,
            score: record.score,
            type: record.type,
            date: record.date,
            sourceFile: filePath,
            extractedData: record
          });

          savedRecords.push(quizScore);
        } else {
          validationErrors.push({
            record,
            errors: validation.errors
          });
        }
      }

      // Clean up file
      fs.unlinkSync(filePath);

      // Update extraction record
      await ExtractedData.update(
        {
          status: 'completed',
          extractedRecords: rawData,
          normalizedRecords: normalizedData,
          validationErrors,
          processedAt: new Date()
        },
        { where: { id: extractionId } }
      );

      console.log(`✅ Processed ${savedRecords.length} records from ${filePath}`);

    } catch (error) {
      console.error('Processing error:', error);
      
      // Update status to failed
      await ExtractedData.update(
        {
          status: 'failed',
          metadata: { error: error.message }
        },
        { where: { id: extractionId } }
      );
    }
  }

  /**
   * Get extraction status
   */
  async getExtractionStatus(req, res) {
    try {
      const { extractionId } = req.params;
      
      const extraction = await ExtractedData.findByPk(extractionId);
      
      if (!extraction) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Extraction not found' }
        });
      }

      return res.json({
        success: true,
        data: {
          id: extraction.id,
          fileName: extraction.fileName,
          status: extraction.status,
          processedAt: extraction.processedAt,
          recordCount: extraction.normalizedRecords?.length || 0,
          errors: extraction.validationErrors || []
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'STATUS_ERROR', message: error.message }
      });
    }
  }
}

module.exports = new UploadController();
