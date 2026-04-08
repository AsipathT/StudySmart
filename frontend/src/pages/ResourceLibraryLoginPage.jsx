import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Divider, Form, Input, message, Row, Segmented, Space, Tag, Typography } from 'antd';
import { LoginOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { hasValidRlLoginIntent } from '../components/resourceLibrary/rlLoginIntent';
import './ResourceLibraryDashboard.css';

const { Title, Text } = Typography;

/** Demo credentials (Mongo seed in `auth.routes`). */
const RESOURCE_LIBRARY_ADMIN_DUMMY = {
  id: 'a1',
  name: 'Resource Library Admin',
  displayUsername: 'resourceadmin',
  email: 'resourceadmin@gmail.com',
  password: 'RAdmin123',
  role: 'resource_admin',
  appType: 'resource-library',
};

const DEMO_ACCOUNTS = {
  student: [
    { id: 's1', name: 'Kasun', email: 'kasun@gmail.com', password: 'kasun123', role: 'student', appType: 'resource-library' },
    { id: 's2', name: 'Nadeesha', email: 'nadeesha@gmail.com', password: 'nadeesha123', role: 'student', appType: 'resource-library' },
    { id: 's3', name: 'Dulani', email: 'dulani@gmail.com', password: 'dulani123', role: 'student', appType: 'resource-library' },
    { id: 's4', name: 'Chamod', email: 'chamod@gmail.com', password: 'chamod123', role: 'student', appType: 'resource-library' },
    { id: 's5', name: 'Ishani', email: 'ishani@gmail.com', password: 'ishani123', role: 'student', appType: 'resource-library' },
  ],
};

const ResourceLibraryLoginPage = () => {
  const navigate = useNavigate();
  const { login, demoLogin, user, token, loading: authLoading } = useAuth();
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickAdminLoading, setQuickAdminLoading] = useState(false);
  const [form] = Form.useForm();

  const accounts = useMemo(() => (role === 'student' ? DEMO_ACCOUNTS.student : []), [role]);

  useEffect(() => {
    if (authLoading) return;
    if (user || token) {
      navigate('/resource-library/dashboard', { replace: true });
      return;
    }
    if (!hasValidRlLoginIntent()) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, token, navigate]);

  const handleResourceAdminQuickLogin = async () => {
    setError(null);
    setQuickAdminLoading(true);
    const email = RESOURCE_LIBRARY_ADMIN_DUMMY.email;
    const result = await login(email, RESOURCE_LIBRARY_ADMIN_DUMMY.password);
    setQuickAdminLoading(false);
    if (result.success) {
      navigate('/resource-library/dashboard');
      return;
    }
    message.error(
      result.error ||
        'Resource Admin sign-in failed. Use a real account JWT (MongoDB must be running and the seeded admin must exist). Demo tokens are not supported here.'
    );
  };

  const handleNormalLogin = async (values) => {
    setLoading(true);
    setError(null);
    const emailLc = String(values.email || '').toLowerCase();
    const isSeededRlAdmin =
      emailLc === RESOURCE_LIBRARY_ADMIN_DUMMY.email.toLowerCase() &&
      values.password === RESOURCE_LIBRARY_ADMIN_DUMMY.password;
    if (isSeededRlAdmin) {
      const result = await login(values.email, values.password);
      setLoading(false);
      if (!result.success) {
        setError(result.error || 'Failed to sign in.');
        return;
      }
      navigate('/resource-library/dashboard');
      return;
    }
    const demo = DEMO_ACCOUNTS.student.find(
      (x) => x.email.toLowerCase() === emailLc && x.password === values.password
    );
    if (demo) {
      demoLogin(demo);
      setLoading(false);
      navigate('/resource-library/dashboard');
      return;
    }
    const result = await login(values.email, values.password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to sign in.');
      return;
    }
    navigate('/resource-library/dashboard');
  };

  const handleDemoLogin = async (account) => {
    setError(null);
    demoLogin(account);
    navigate('/resource-library/dashboard');
  };

  const isAdminTab = role === 'admin';

  return (
    <div className="rl-auth-page">
      <div className="rl-auth-inner">
        <Card className="rl-auth-main-card" style={{ borderRadius: 12 }}>
          <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 14 }}>
            <Title level={3} style={{ margin: 0 }}>StudySmart</Title>
            <Text type="secondary">Sign in to the Resource Library</Text>
          </Space>

          <Segmented
            block
            size="middle"
            value={role}
            onChange={setRole}
            options={[
              { label: 'Resource Admin', value: 'admin' },
              { label: 'Student', value: 'student' },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Form form={form} layout="vertical" size="middle" onFinish={handleNormalLogin}>
            <Form.Item
              name="email"
              label="University Email"
              rules={[{ required: true, message: 'Please input your email' }, { type: 'email', message: 'Enter a valid email' }]}
            >
              <Input placeholder="e.g. it22541045@my.sliit.lk" prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block loading={loading}>
              Sign in
            </Button>
          </Form>

          {isAdminTab ? (
            <>
              <Divider />
              <Text strong>Resource Admin demo (dev)</Text>
              <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 10, maxHeight: 200, overflowY: 'auto', paddingRight: 6 }}>
                <Card size="small" styles={{ body: { padding: 10 } }}>
                  <Row justify="space-between" align="middle" gutter={8}>
                    <Col flex="auto">
                      <div style={{ fontWeight: 600 }}>{RESOURCE_LIBRARY_ADMIN_DUMMY.name}</div>
                      <div style={{ color: '#475569', fontWeight: 500 }}>{RESOURCE_LIBRARY_ADMIN_DUMMY.displayUsername}</div>
                      <div style={{ color: '#475569', fontWeight: 500 }}>{RESOURCE_LIBRARY_ADMIN_DUMMY.email}</div>
                      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Password: {RESOURCE_LIBRARY_ADMIN_DUMMY.password}</div>
                    </Col>
                    <Col>
                      <Tag color="purple">resource_admin</Tag>
                      <Button
                        size="small"
                        type="link"
                        htmlType="button"
                        loading={quickAdminLoading}
                        onClick={handleResourceAdminQuickLogin}
                      >
                        Use
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Space>
            </>
          ) : (
            <>
              <Divider />
              <Text strong>Student demo accounts (dev)</Text>
              <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 10, maxHeight: 200, overflowY: 'auto', paddingRight: 6 }}>
                {accounts.map((acc) => (
                  <Card key={acc.id} size="small" styles={{ body: { padding: 10 } }}>
                    <Row justify="space-between" align="middle" gutter={8}>
                      <Col flex="auto">
                        <div style={{ fontWeight: 600 }}>{acc.name}</div>
                        <div style={{ color: '#475569', fontWeight: 500 }}>{acc.email}</div>
                        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Password: {acc.password}</div>
                      </Col>
                      <Col>
                        <Tag color="blue">student</Tag>
                        <Button size="small" type="link" htmlType="button" onClick={() => handleDemoLogin(acc)}>Use</Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResourceLibraryLoginPage;
