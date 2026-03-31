import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // SLIIT Email validation
  const validateSLIITEmail = (email) => {
    const sliitRegex = /^IT\d{8}@my\.sliit\.lk$/i;
    return sliitRegex.test(email);
  };

  const onEmailChange = (e) => {
    const email = e.target.value;
    if (email && !validateSLIITEmail(email)) {
      setEmailError('Email must be in format: IT12345678@my.sliit.lk');
    } else {
      setEmailError('');
    }
  };

  const onFinish = async (values) => {
    setError('');
    setEmailError('');

    // Frontend validation
    if (!validateSLIITEmail(values.email)) {
      setEmailError('Email must be in SLIIT format: IT12345678@my.sliit.lk');
      toast.error('❌ Invalid email format');
      return;
    }

    if (values.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('❌ Password too weak');
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      toast.error('❌ Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: values.name,
        email: values.email,
        password: values.password
      });

      if (result.success) {
        toast.success('✅ Account created successfully!');
        form.resetFields();
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        const errMsg = result.error || result.message || 'Registration failed';
        setError(errMsg);
        toast.error('❌ ' + errMsg);
      }
    } catch (err) {
      const errMsg = err.message || 'Registration failed';
      setError(errMsg);
      toast.error('❌ ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
          <Title level={2} style={{ margin: 0 }}>StudySmart</Title>
          <Text type="secondary">Create your SLIIT account</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError('')}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
        >
          {/* Full Name */}
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="John Doe"
              size="large"
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="email"
            label="SLIIT Email"
            rules={[
              { required: true, message: 'Please enter your SLIIT email' },
              {
                pattern: /^IT\d{8}@my\.sliit\.lk$/i,
                message: 'Email must be in format: IT12345678@my.sliit.lk'
              }
            ]}
            help="Use your SLIIT email address (e.g., IT21345678@my.sliit.lk)"
            validateStatus={emailError ? 'error' : ''}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="IT12345678@my.sliit.lk"
              size="large"
              onChange={onEmailChange}
              type="email"
            />
          </Form.Item>
          {emailError && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: -12, marginBottom: 8 }}>{emailError}</div>}

          {/* Password */}
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
            help="Minimum 6 characters"
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          {/* Confirm Password */}
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{ marginTop: 10 }}
            >
              {loading ? <Spin size="small" style={{ marginRight: 8 }} /> : null}
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: 'bold' }}>Login</Link>
          </Text>
        </div>

        <div style={{ marginTop: 20, padding: '12px', background: '#f0f2f5', borderRadius: 6, fontSize: 12, textAlign: 'center', color: '#666' }}>
          <strong>Demo Admin:</strong><br />
          Email: admin@nidu.sliit.lk<br />
          Password: nidu@123
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;