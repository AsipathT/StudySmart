import React, { useState, useCallback } from 'react';
import { Upload, message, Button, Progress, Space, Typography } from 'antd';
import { InboxOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import uploadService from '../../services/upload.service';

const { Dragger } = Upload;
const { Text } = Typography;

const FileUpload = ({ onUploadComplete, multiple = false }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const customRequest = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadService.uploadFile(file, (percent) => {
        setProgress(percent);
      });

      if (result.success) {
        message.success(`${file.name} uploaded successfully`);
        onSuccess(result.data);
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      message.error(`${file.name} upload failed: ${error.message}`);
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const props = {
    name: 'file',
    multiple,
    customRequest,
    accept: '.pdf,.csv',
    showUploadList: {
      showRemoveIcon: true,
      showPreviewIcon: true,
    },
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <div>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for PDF or CSV files. Max file size: 20MB.
        </p>
        <Space size="large" style={{ marginTop: 16 }}>
          <Text type="secondary">
            <FilePdfOutlined /> PDF
          </Text>
          <Text type="secondary">
            <FileExcelOutlined /> CSV
          </Text>
        </Space>
      </Dragger>

      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" />
        </div>
      )}
    </div>
  );
};

export default FileUpload;