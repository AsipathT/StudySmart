import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Empty, Button, Row, Col, Space, Typography, Tooltip, Modal, Form, Input, Select, message, Result } from 'antd';
import { DeleteOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import uploadService from '../services/upload.service';

const { Title, Text } = Typography;

const HistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await uploadService.getExtractionHistory();
      const historyData = data?.data ?? [];
      setHistory(historyData);
      sessionStorage.setItem('uploadHistory', JSON.stringify(historyData));
    } catch (error) {
      console.error('Failed to load history:', error);
      message.error('Failed to load history (will fallback to local cache)');
      const fallback = sessionStorage.getItem('uploadHistory');
      if (fallback) {
        setHistory(JSON.parse(fallback));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setEditingId(record.id);
    editForm.setFieldsValue({
      fileName: record.fileName,
      fileType: record.fileType,
      status: record.status,
      recordCount: record.recordCount
    });
    setIsModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await uploadService.updateExtraction(currentRecord.id, values);
      message.success('Record updated successfully');
      setIsModalVisible(false);
      setEditingId(null);
      loadHistory();
    } catch (error) {
      console.error('Failed to update record:', error);
      message.error('Failed to update record');
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Record',
      content: `Are you sure you want to delete "${record.fileName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await uploadService.deleteExtraction(record.id);
          message.success('Record deleted successfully');
          loadHistory();
        } catch (error) {
          console.error('Failed to delete record:', error);
          message.error('Failed to delete record');
        }
      }
    });
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
      render: (fileType) => (
        <Tag>{(fileType || 'unknown').toString().toUpperCase()}</Tag>
      )
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
          {isAdmin && (
            <>
              <Tooltip title="Edit">
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  size="small"
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];


  // Edit/delete is admin-only, but everyone can view upload history.
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
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Upload Record"
        visible={isModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingId(null);
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="fileName"
            label="File Name"
            rules={[{ required: true, message: 'Please input file name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fileType"
            label="File Type"
            rules={[{ required: true, message: 'Please select file type' }]}
          >
            <Select options={[
              { label: 'CSV', value: 'csv' },
              { label: 'EXCEL', value: 'excel' },
              { label: 'PDF', value: 'pdf' }
            ]} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Processing', value: 'processing' },
              { label: 'Completed', value: 'completed' },
              { label: 'Failed', value: 'failed' }
            ]} />
          </Form.Item>
          <Form.Item
            name="recordCount"
            label="Record Count"
            rules={[{ required: true, message: 'Please input record count' }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HistoryPage;
