import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Empty, Button, Row, Col, Space, Typography, Tooltip } from 'antd';
import { DeleteOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import uploadService from '../services/upload.service';

const { Title, Text } = Typography;

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await uploadService.getExtractionHistory();
      setHistory(data.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName'
    },
    {
      title: 'Type',
      dataIndex: 'fileType',
      key: 'fileType',
      render: (fileType) => <Tag>{fileType.toUpperCase()}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          completed: 'success',
          processing: 'processing',
          failed: 'error',
          pending: 'warning'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Records',
      dataIndex: 'recordCount',
      key: 'recordCount'
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Download">
            <Button type="text" icon={<DownloadOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="history-page">
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ margin: 0 }}>Upload History</Title>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadHistory} loading={loading}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        {history.length === 0 ? (
          <Empty description="No upload history" />
        ) : (
          <Table
            columns={columns}
            dataSource={history}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
