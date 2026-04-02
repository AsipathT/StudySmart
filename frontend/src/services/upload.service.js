import api from './api';

class UploadService {
  /**
   * Upload file (PDF / CSV / Excel)
   *
   * ✅ Now accepts studentId and appends it to FormData so the backend
   * can locate and return that specific student's row from anywhere in
   * the file — not just the first N rows.
   *
   * Do NOT manually set Content-Type header. When you set
   * 'Content-Type': 'multipart/form-data' manually, axios omits the
   * required boundary parameter. Let axios set it automatically.
   */
  async uploadFile(file, formData, onUploadProgress) {
    const data = new FormData();
    data.append('file', file);

    // Append form data
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    const response = await api.post('/upload/upload', data, {
      headers: {
        'Content-Type': undefined, // let axios set multipart/form-data with boundary
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percent);
        }
      },
    });

    return response.data;
  }

  /**
   * Get extraction status
   */
  async getExtractionStatus(extractionId) {
    const response = await api.get(`/upload/extraction/${extractionId}`);
    return response.data;
  }

  /**
   * Get extraction history
   */
  async getExtractionHistory() {
    const response = await api.get('/upload/history');
    return response.data;
  }

  /**
   * Get extraction statistics
   */
  async getExtractionStats() {
    const response = await api.get('/upload/stats');
    return response.data;
  }

  /**
   * Delete extraction
   */
  async deleteExtraction(extractionId) {
    const response = await api.delete(`/upload/extraction/${extractionId}`);
    return response.data;
  }

  /**
   * Update extraction (Admin only)
   */
  async updateExtraction(extractionId, data) {
    const response = await api.put(`/upload/extraction/${extractionId}`, data);
    return response.data;
  }

  /**
   * Download extracted data
   */
  async downloadExtractedData(extractionId, format = 'json') {
    const response = await api.get(`/upload/download/${extractionId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Validate file before upload (client-side check before sending)
   */
  validateFile(file) {
    const errors = [];
    if (file.size > 20 * 1024 * 1024) {
      errors.push('File size must be less than 20MB');
    }
    const validTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(pdf|csv|xlsx|xls)$/i)
    ) {
      errors.push('Only PDF, CSV, and Excel files are allowed');
    }
    return { isValid: errors.length === 0, errors };
  }
}

export default new UploadService();