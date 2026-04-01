import React, { useState, useCallback } from 'react';
import { Card, Upload, Button, Progress, Alert, Space, Typography } from 'antd';
import { InboxOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import uploadService from '../../services/upload.service';
import './FileUpload.css';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const FileUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [extractionId, setExtractionId] = useState(null);

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    setUploadStatus({ type: 'info', message: 'Uploading file...' });

    try {
      // Upload file
      const result = await uploadService.uploadFile(file, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      });

      if (result.success) {
        setExtractionId(result.data.extractionId);
        setUploadStatus({
          type: 'success',
          message: 'File uploaded successfully. Processing...',
        });

        // Poll for extraction status
        await uploadService.pollExtractionStatus(
          result.data.extractionId,
          (status) => {
            if (status.status === 'completed') {
              setUploadStatus({
                type: 'success',
                message: `✅ Processed ${status.recordCount} records successfully!`,
              });
              setUploading(false);
              
              if (onUploadComplete) {
                onUploadComplete(status);
              }
            } else if (status.status === 'failed') {
              setUploadStatus({
                type: 'error',
                message: '❌ Processing failed. Please try again.',
              });
              setUploading(false);
            }
          }
        );
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.error?.message || 'Upload failed. Please try again.',
      });
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <Card className="upload-card">
      <Title level={4}>Upload Student Marks</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Upload PDF or CSV files containing student marks. The system will automatically extract and normalize the data.
      </Text>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        <InboxOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <p className="dropzone-text">
          {isDragActive
            ? 'Drop the file here'
            : 'Click or drag file to this area to upload'}
        </p>
        <p className="dropzone-hint">
          Support: PDF, CSV (Max 10MB)
        </p>
      </div>

      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 24 }}>
        {uploading && (
          <div>
            <Progress percent={progress} status="active" />
            <Text type="secondary">{uploadStatus?.message}</Text>
          </div>
        )}

        {uploadStatus && !uploading && (
          <Alert
            message={uploadStatus.message}
            type={uploadStatus.type}
            showIcon
            closable
            onClose={() => setUploadStatus(null)}
          />
        )}

        <div className="file-format-info">
          <Space size="large">
            <Space>
              <FilePdfOutlined style={{ color: '#ff4d4f' }} />
              <Text>PDF: Grade reports, transcripts</Text>
            </Space>
            <Space>
              <FileExcelOutlined style={{ color: '#52c41a' }} />
              <Text>CSV: Student numbers, subjects, scores</Text>
            </Space>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default FileUpload;