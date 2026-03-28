const XLSX = require('xlsx');

class ExcelProcessorService {
  /**
   * Process Excel file and extract data
   */
  async processExcel(filePath) {
    try {
      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      
      // Get all sheet names
      const sheetNames = workbook.SheetNames;
      console.log('Sheets found:', sheetNames);
      
      const extractedData = {
        fileName: path.basename(filePath),
        sheets: [],
        allRecords: [],
        summary: {},
        failedStudents: []
      };

      // Process each sheet
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row (usually row 4 in your file)
        const headers = jsonData[3] || []; // "No", "Registration No", "CA Marks", "Grade", "Status"
        
        // Convert to structured data
        const records = [];
        for (let i = 4; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length > 0 && row[0]) { // Skip empty rows
            const record = {
              no: row[0],
              registrationNo: row[1] ? row[1].toString().replace(/\s+/g, ' ') : '',
              caMarks: parseFloat(row[2]) || 0,
              grade: row[3] || '',
              status: row[4] || ''
            };
            
            if (record.registrationNo) {
              records.push(record);
              
              // Add to all records
              extractedData.allRecords.push({
                studentNumber: this.extractStudentNumber(record.registrationNo),
                name: `Student ${record.registrationNo}`,
                subject: 'IT3060 - Human Computer Interaction',
                score: record.caMarks,
                grade: record.grade,
                status: record.status,
                type: 'final', // or 'quiz' based on your needs
                date: new Date().toISOString()
              });
            }
          }
        }
        
        extractedData.sheets.push({
          name: sheetName,
          records: records
        });

        // Extract summary data if this is the Summary sheet
        if (sheetName.toLowerCase().includes('summary')) {
          extractedData.summary = this.extractSummary(jsonData);
        }

        // Extract failed students if this is the Failed Students sheet
        if (sheetName.toLowerCase().includes('fail')) {
          extractedData.failedStudents = records.filter(r => r.status === 'Fail');
        }
      });

      return extractedData;
    } catch (error) {
      console.error('Excel processing error:', error);
      throw new Error(`Failed to process Excel file: ${error.message}`);
    }
  }

  /**
   * Extract student number from registration number
   * Example: "IT 22 0949 40" -> "IT22094940"
   */
  extractStudentNumber(registrationNo) {
    if (!registrationNo) return '';
    return registrationNo.replace(/\s+/g, '');
  }

  /**
   * Extract summary statistics from Summary sheet
   */
  extractSummary(jsonData) {
    const summary = {};
    
    // Find key statistics
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 2) continue;
      
      const label = row[0] ? row[0].toString().toLowerCase() : '';
      const value = row[1];
      
      if (label.includes('total students')) summary.totalStudents = value;
      if (label.includes('passed')) summary.passed = value;
      if (label.includes('failed')) summary.failed = value;
      if (label.includes('pass rate')) summary.passRate = value;
      if (label.includes('highest')) summary.highestMark = value;
      if (label.includes('lowest')) summary.lowestMark = value;
      if (label.includes('average')) summary.averageMark = value;
    }
    
    return summary;
  }

  /**
   * Convert Excel date to JS Date
   */
  excelDateToJSDate(excelDate) {
    if (!excelDate) return new Date();
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return date;
  }
}

module.exports = new ExcelProcessorService();