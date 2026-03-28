const pdf = require('pdf-parse');
const fs = require('fs');
const csv = require('csv-parse');
const { v4: uuidv4 } = require('uuid');

class PDFExtractionService {
  /**
   * Extract data from PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<Object>} Extracted data
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      // Extract text content
      const text = data.text;
      
      // Parse text to find structured data (grades, student info, etc.)
      const extractedData = this.parsePDFContent(text);
      
      return {
        success: true,
        text: text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
        extractedData: extractedData
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  /**
   * Extract data from CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} Extracted records
   */
  async extractFromCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv.parse({ columns: true, trim: true }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Parse PDF content to extract structured data
   * @param {string} text - PDF text content
   * @returns {Object} Structured data
   */
  parsePDFContent(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const extractedData = {
      students: [],
      scores: [],
      metadata: {}
    };

    // Common patterns in academic documents
    const patterns = {
      studentNumber: /[0-9]{8,10}/g, // 8-10 digit student numbers
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      score: /\b(\d{1,3}(\.\d{1,2})?)\s*[\/%]?\s*(?=\s*(?:mark|score|grade))/gi,
      subject: /(?:Subject|Course|Module):\s*([^\n]+)/i,
      date: /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/g
    };

    // Extract student numbers
    const studentNumbers = text.match(patterns.studentNumber) || [];
    extractedData.students = [...new Set(studentNumbers)];

    // Extract scores with context
    const scoreMatches = text.matchAll(/(\w+)\s+(\d{1,3}(?:\.\d{1,2})?)\s*\/\s*(\d{1,3})/g);
    for (const match of scoreMatches) {
      extractedData.scores.push({
        subject: match[1],
        score: parseFloat(match[2]),
        maxScore: parseFloat(match[3]),
        percentage: (parseFloat(match[2]) / parseFloat(match[3])) * 100
      });
    }

    return extractedData;
  }

  /**
   * Detect document type based on content
   * @param {string} text - PDF text content
   * @returns {string} Document type
   */
  detectDocumentType(text) {
    if (text.match(/transcript|grade|mark|score/i)) {
      return 'grade_report';
    } else if (text.match(/exam|test|quiz|assessment/i)) {
      return 'exam_paper';
    } else if (text.match(/attendance|present|absent/i)) {
      return 'attendance';
    } else if (text.match(/syllabus|curriculum|course outline/i)) {
      return 'syllabus';
    }
    return 'unknown';
  }
}

module.exports = new PDFExtractionService();