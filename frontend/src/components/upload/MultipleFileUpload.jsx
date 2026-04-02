import React, { useState, useEffect } from 'react';
import {
  Upload, message, Button, Progress, Space, Typography,
  Card, Table, Tag, Statistic, Row, Col, List, Empty,
  Spin, Alert, Modal, Divider, Tooltip
} from 'antd';
import {
  InboxOutlined, FilePdfOutlined, FileExcelOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  CloseCircleOutlined, UploadOutlined, ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import uploadService from '../../services/upload.service';
import analyticsService from '../../services/analytics.service';

const { Dragger } = Upload;
const { Text, Title } = Typography;

const MultipleFileUpload = ({ onUploadComplete, onAnalyticsUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]);

  // Fetch user analytics after uploads
  const fetchUserAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await analyticsService.getUserAnalytics();
      if (response.success) {
        setUserAnalytics(response.data);
        if (onAnalyticsUpdate) {
          onAnalyticsUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to fetch analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadService.uploadFile(file, (percent) => {
        setProgress(percent);
      });

      if (result.success) {
        const uploadRecord = {
          id: result.data.extractionId,
          fileName: file.name,
          status: 'success',
          recordsCount: result.data.recordsCount,
          studentFound: result.data.studentFound,
          timestamp: new Date().toISOString(),
          preview: result.data.preview
        };

        message.success(`${file.name} uploaded successfully (${result.data.recordsCount} records)`);
        setUploads([uploadRecord, ...uploads]);
        onSuccess(result.data);

        // Fetch updated analytics
        await fetchUserAnalytics();

        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorRecord = {
        fileName: file.name,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      message.error(`${file.name} upload failed: ${error.message}`);
      setUploads([errorRecord, ...uploads]);
      onError(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const props = {
    name: 'file',
    multiple: true,
    customRequest,
    accept: '.pdf,.csv,.xls,.xlsx',
    showUploadList: false,
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        // Auto-handled by customRequest
      } else if (status === 'error') {
        // Auto-handled by customRequest
      }
    }
  };

  const uploadColumns = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text) => <Text ellipsis>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {' '}
          {status === 'success' ? 'Success' : 'Failed'}
        </Tag>
      )
    },
    {
      title: 'Records',
      dataIndex: 'recordsCount',
      key: 'recordsCount',
      render: (count) => count ? `${count} records` : 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={3}>📁 Upload Subject Marks</Title>
        <Text type="secondary">
          Upload multiple mark sheets (PDF, CSV, or Excel) one by one. All marks will be aggregated into your analytics.
        </Text>

        <Divider />

        <Dragger {...props} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to upload</p>
          <p className="ant-upload-hint">
            Support for PDF, CSV, XLS, XLSX. Max file size: 20MB each.
          </p>
          <Space size="large" style={{ marginTop: 16 }}>
            <Text type="secondary"><FilePdfOutlined /> PDF</Text>
            <Text type="secondary"><FileExcelOutlined /> Excel</Text>
          </Space>
        </Dragger>

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={progress} status="active" />
          </div>
        )}

        {uploads.length > 0 && (
          <>
            <Divider />
            <Title level={4}>Upload History</Title>
            <Table
              columns={uploadColumns}
              dataSource={uploads.map((u, i) => ({ ...u, key: i }))}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </>
        )}
      </Card>

      {userAnalytics && (
        <Card style={{ marginTop: 20 }}>
          <Title level={3}>📊 Your Analytics Summary</Title>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="GPA"
                value={userAnalytics.gpa}
                suffix="/4.0"
                valueStyle={{ color: userAnalytics.gpa >= 3.0 ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Average Score"
                value={userAnalytics.averageMarks}
                suffix="%"
                valueStyle={{ color: userAnalytics.averageMarks >= 75 ? '#1890ff' : '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Marks"
                value={userAnalytics.totalMarks}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Subjects"
                value={userAnalytics.subjects?.length || 0}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
          </Row>

          <Divider />

          <Title level={4}>Subject Performance</Title>
          {userAnalytics.subjects && userAnalytics.subjects.length > 0 ? (
            <Table
              columns={[
                {
                  title: 'Subject',
                  dataIndex: 'subject',
                  key: 'subject',
                  render: (text) => <Text strong>{text}</Text>
                },
                {
                  title: 'Average',
                  dataIndex: 'average',
                  key: 'average',
                  render: (avg) => (
                    <Text style={{ color: avg >= 75 ? '#52c41a' : avg >= 50 ? '#faad14' : '#ff4d4f' }}>
                      {avg}%
                    </Text>
                  )
                },
                {
                  title: 'Grade',
                  dataIndex: 'grade',
                  key: 'grade',
                  render: (grade) => (
                    <Tag color={getGradeColor(grade)}>{grade}</Tag>
                  )
                },
                {
                  title: 'Count',
                  dataIndex: 'count',
                  key: 'count'
                },
                {
                  title: 'Range',
                  key: 'range',
                  render: (_, record) => `${record.min} - ${record.max}`
                }
              ]}
              dataSource={userAnalytics.subjects.map((s, i) => ({ ...s, key: i }))}
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="No subject data available" />
          )}

          <Divider />

          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loadingAnalytics}
              onClick={fetchUserAnalytics}
            >
              Refresh Analytics
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                const data = JSON.stringify(userAnalytics, null, 2);
                const element = document.createElement('a');
                element.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(data)}`);
                element.setAttribute('download', 'analytics.json');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              Export
            </Button>
          </Space>
        </Card>
      )}

      {loadingAnalytics && (
        <Card style={{ marginTop: 20 }}>
          <Spin size="large" tip="Loading analytics..." />
        </Card>
      )}
    </div>
  );
};

const getGradeColor = (grade) => {
  const g = String(grade).toUpperCase();
  if (g.startsWith('A')) return 'green';
  if (g.startsWith('B')) return 'blue';
  if (g.startsWith('C')) return 'orange';
  if (g.startsWith('D')) return '#faad14';
  return 'red';
};

export default MultipleFileUpload;
