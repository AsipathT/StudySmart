import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Card,
  Form,
  Input,
  Button,
  Alert,
  Row,
  Col,
  Typography,
} from 'antd';
import { LoginOutlined } from '@ant-design/icons';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(values.email, values.password);
      if (result && !result.success) {
        setError(result.error || 'Failed to log in. Please check your credentials.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
      <Col xs={24} sm={16} md={12} lg={8}>
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Title level={2}>StudySmart</Title>
            <p>Welcome back! Please log in to your account.</p>
          </div>
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }}/>}

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} icon={<LoginOutlined />}>
                Log In
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;
