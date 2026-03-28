import { useState, useCallback } from 'react';
import uploadService from '../services/upload.service';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const response = await uploadService.uploadFile(file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      return response;
    } catch (err) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const resetProgress = useCallback(() => {
    setUploadProgress(0);
    setError(null);
  }, []);

  return { uploading, uploadProgress, error, uploadFile, resetProgress };
};

export default useUpload;