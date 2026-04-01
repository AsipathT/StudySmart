import api from './api';

class UploadService {
  /**
   * Upload file (PDF/CSV)
   */
  async uploadFile(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
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
   * Poll extraction status until completed
   */
  async pollExtractionStatus(extractionId, onStatusUpdate) {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const result = await this.getExtractionStatus(extractionId);
          
          if (onStatusUpdate) {
            onStatusUpdate(result.data);
          }

          if (result.data.status === 'completed') {
            resolve(result.data);
          } else if (result.data.status === 'failed') {
            reject(new Error('Extraction failed'));
          } else {
            // Continue polling
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }
}

export default new UploadService();