import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import './RegisterPage.css';

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
      setEmailError('Use format: IT12345678@my.sliit.lk');
    } else {
      setEmailError('');
    }
  };

  const onFinish = async (values) => {
    setError('');
    setEmailError('');

    if (!validateSLIITEmail(values.email)) {
      setEmailError('Invalid SLIIT email format');
      toast.error('Invalid email format');
      return;
    }

    if (values.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password too short');
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (result.success) {
        toast.success('Account created successfully!');
        form.resetFields();
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        const errMsg = result.error || 'Registration failed';
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      const errMsg = err.message || 'Registration failed';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Card className="register-card">

        {/* Header */}
        <div className="register-header">
          <div className="register-icon">🎓</div>
          <Title level={2} className="register-title">StudySmart</Title>
          <Text type="secondary">Create your SLIIT account</Text>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
        >
          {/* Name */}
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Enter your full name' }]}
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
              { required: true },
              {
                pattern: /^IT\d{8}@my\.sliit\.lk$/i,
                message: 'Format: IT12345678@my.sliit.lk',
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="IT12345678@my.sliit.lk"
              size="large"
              onChange={onEmailChange}
            />
          </Form.Item>

          {emailError && (
            <div className="error-text">{emailError}</div>
          )}

          {/* Password */}
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true },
              { min: 6, message: 'Minimum 6 characters' },
            ]}
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
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Passwords do not match');
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

          {/* Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="register-btn"
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="register-footer">
          <Text type="secondary">
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Login
            </Link>
          </Text>
        </div>

        {/* Demo Admin */}
        <div className="demo-box">
          <strong>Demo Admin</strong><br />
          admin@nidu.sliit.lk<br />
          nidu@123
        </div>

      </Card>
    </div>
  );
};

export default RegisterPage;