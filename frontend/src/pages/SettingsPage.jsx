import React, { useState } from 'react';
import { Card, Form, Switch, Button, Row, Col, Space, Typography, Alert, Select, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <Card style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Settings</Title>
      </Card>

      {saveSuccess && (
        <Alert
          message="Settings saved successfully!"
          type="success"
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      <Row gutter={[24, 24]}>
        {/* General Settings */}
        <Col xs={24} lg={12}>
          <Card title="General Settings">
            <Form layout="vertical">
              <Form.Item label="Theme">
                <Select defaultValue="light">
                  <Option value="light">Light</Option>
                  <Option value="dark">Dark</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Notifications">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Email Alerts">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Auto-save">
                <Switch defaultChecked />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Privacy Settings */}
        <Col xs={24} lg={12}>
          <Card title="Privacy & Security">
            <Form layout="vertical">
              <Form.Item label="Profile Visibility">
                <Select defaultValue="private">
                  <Option value="public">Public</Option>
                  <Option value="private">Private</Option>
                  <Option value="friends">Friends Only</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Data Collection">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Two-Factor Authentication">
                <Switch />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Upload Settings */}
        <Col xs={24} lg={12}>
          <Card title="Upload Settings">
            <Form layout="vertical">
              <Form.Item label="Max File Size (MB)">
                <Select defaultValue="20">
                  <Option value="10">10 MB</Option>
                  <Option value="20">20 MB</Option>
                  <Option value="50">50 MB</Option>
                  <Option value="100">100 MB</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Auto-process Files">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Keep Original Files">
                <Switch />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Notification Settings */}
        <Col xs={24} lg={12}>
          <Card title="Notification Preferences">
            <Form layout="vertical">
              <Form.Item label="Upload Completion">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Error Alerts">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Weekly Reports">
                <Switch defaultChecked />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card>
            <Space>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                Save Settings
              </Button>
              <Button>Reset to Default</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SettingsPage;
