class DataNormalizationService {
  /**
   * Normalize extracted data to standard format
   * @param {Object} extractedData - Raw extracted data
   * @param {string} sourceType - Source file type (pdf/csv)
   * @returns {Array} Normalized records
   */
  normalizeData(extractedData, sourceType) {
    if (sourceType === 'csv') {
      return this.normalizeCSVData(extractedData);
    } else {
      return this.normalizePDFData(extractedData);
    }
  }

  /**
   * Normalize CSV data
   * @param {Array} csvData - Raw CSV data
   * @returns {Array} Normalized records
   */
  normalizeCSVData(csvData) {
    return csvData.map(record => {
      const normalized = {
        studentNumber: this.normalizeStudentNumber(record.studentNumber || record.student_id || record.id),
        name: this.normalizeName(record.name || record.student_name),
        subject: this.normalizeSubject(record.subject || record.course || record.module),
        score: this.normalizeScore(record.score || record.marks || record.grade),
        type: this.normalizeAssessmentType(record.type || record.assessment_type),
        date: this.normalizeDate(record.date || record.exam_date),
        metadata: record
      };
      
      // Validate required fields
      if (!normalized.studentNumber || !normalized.subject || normalized.score === null) {
        normalized.validationError = 'Missing required fields';
      }
      
      return normalized;
    });
  }

  /**
   * Normalize PDF data
   * @param {Object} pdfData - Extracted PDF data
   * @returns {Array} Normalized records
   */
  normalizePDFData(pdfData) {
    const normalizedRecords = [];
    
    // Process scores from PDF
    if (pdfData.scores && pdfData.scores.length > 0) {
      pdfData.scores.forEach(score => {
        normalizedRecords.push({
          studentNumber: pdfData.students[0] || 'unknown',
          subject: score.subject || 'unknown',
          score: score.percentage || score.score,
          type: 'quiz',
          date: new Date().toISOString(),
          metadata: score
        });
      });
    }
    
    return normalizedRecords;
  }

  /**
   * Normalize student number format
   * @param {string} studentNumber - Raw student number
   * @returns {string} Normalized student number
   */
  normalizeStudentNumber(studentNumber) {
    if (!studentNumber) return null;
    // Remove any non-alphanumeric characters
    return studentNumber.toString().replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Normalize name format
   * @param {string} name - Raw name
   * @returns {string} Normalized name
   */
  normalizeName(name) {
    if (!name) return null;
    // Capitalize first letter of each word
    return name.toString()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Normalize subject name
   * @param {string} subject - Raw subject
   * @returns {string} Normalized subject
   */
  normalizeSubject(subject) {
    if (!subject) return null;
    // Clean up subject names
    return subject.toString()
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize score to percentage
   * @param {string|number} score - Raw score
   * @returns {number} Normalized score (0-100)
   */
  normalizeScore(score) {
    if (!score) return null;
    
    // Handle different formats
    const scoreStr = score.toString().trim();
    
    // Check if it's a fraction (e.g., "45/50")
    if (scoreStr.includes('/')) {
      const [obtained, total] = scoreStr.split('/').map(Number);
      return Math.round((obtained / total) * 100);
    }
    
    // Check if it already has % symbol
    if (scoreStr.includes('%')) {
      return parseFloat(scoreStr.replace('%', ''));
    }
    
    // Assume it's already a percentage
    return parseFloat(scoreStr);
  }

  /**
   * Normalize assessment type
   * @param {string} type - Raw assessment type
   * @returns {string} Normalized type
   */
  normalizeAssessmentType(type) {
    if (!type) return 'quiz';
    
    const typeLower = type.toLowerCase();
    if (typeLower.includes('final')) return 'final';
    if (typeLower.includes('mid')) return 'midterm';
    if (typeLower.includes('assign')) return 'assignment';
    return 'quiz';
  }

  /**
   * Normalize date format
   * @param {string} dateStr - Raw date string
   * @returns {string} ISO date string
   */
  normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Validate normalized record
   * @param {Object} record - Normalized record
   * @returns {Object} Validation result
   */
  validateRecord(record) {
    const errors = [];
    
    if (!record.studentNumber || record.studentNumber.length < 5) {
      errors.push('Invalid student number');
    }
    
    if (!record.subject) {
      errors.push('Subject is required');
    }
    
    if (record.score === null || isNaN(record.score) || record.score < 0 || record.score > 100) {
      errors.push('Score must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new DataNormalizationService();