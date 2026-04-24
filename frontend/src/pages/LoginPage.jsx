import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

/* ── Animated Counter for Stats ── */
const Counter = ({ to, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 50);
    const t = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(start);
      if (start >= to) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <span>{val.toLocaleString()}{suffix}</span>;
};

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showPass, setShowPass] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch('http://localhost:5000/health');
      setConnectionStatus(response.ok ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('✅ Welcome back to StudySmart!', {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: '600',
          },
        });
        
        // Redirect based on role
        if (result.user?.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (result.user?.role === 'resource_admin') {
          navigate('/resource-library/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        const errorMsg = result.error || result.message || 'Login failed. Please check your credentials.';
        setError(errorMsg);
        toast.error('❌ ' + errorMsg, {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '600',
          },
        });
      }
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please try again.';
      setError(errMsg);
      toast.error('❌ ' + errMsg, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: '600',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast('🔐 Contact your administrator to reset your password', {
      duration: 4000,
      icon: '💡',
    });
  };

  const offline = connectionStatus === 'disconnected';

  return (
    <div className="lp">
      {/* ══════════════════ LEFT PANEL — Campus Showcase ══════════════════ */}
      <div className="lp__left">
        {/* Campus Image */}
        <img
          src="/images/SLIIT-malabe.jpg"
          alt="SLIIT Malabe Campus"
          className={`lp__campus${imgLoaded ? ' lp__campus--loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        {/* Enhanced Overlay Layers */}
        <div className="lp__overlay lp__overlay--dark" />
        <div className="lp__overlay lp__overlay--accent" />
        <div className="lp__overlay lp__overlay--vignette" />

        {/* Left Panel Content */}
        <div className="lp__left-content">
          {/* Premium Brand Header */}
          <div className="lp__brand">
            <div className="lp__brand-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="6" fill="white" opacity="0.15" />
                <path
                  d="M8 22L16 10l8 12H8z"
                  fill="white"
                  opacity="0.9"
                />
                <circle cx="16" cy="16" r="3.5" fill="white" />
              </svg>
            </div>
            <span className="lp__brand-name">StudySmart</span>
          </div>

          {/* Hero Section */}
          <div className="lp__headline">
            <div className="lp__tag">SLIIT · Malabe Campus</div>
            <h1 className="lp__h1">
              Master your academics with{' '}
              <span className="lp__h1-accent">intelligent insights</span>
            </h1>
            <p className="lp__desc">
              Track performance, predict outcomes, and make data-driven decisions — all powered by AI for SLIIT students.
            </p>
          </div>

          {/* Enhanced Stat Cards */}
          <div className="lp__stats">
            {[
              { icon: '📊', label: 'Assessments Tracked', val: 1500, suffix: '+' },
              { icon: '🎓', label: 'Active Students', val: 450, suffix: '+' },
              { icon: '📈', label: 'Avg GPA Gain', val: 0.5, suffix: ' pts' },
            ].map(({ icon, label, val, suffix }) => (
              <div key={label} className="lp__stat">
                <div className="lp__stat-icon">{icon}</div>
                <div className="lp__stat-val">
                  <Counter to={val} suffix={suffix} />
                </div>
                <div className="lp__stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Feature Pills */}
          <div className="lp__features">
            {[
              { icon: '🤖', text: 'AI-powered predictions' },
              { icon: '📊', text: 'Real-time analytics' },
              { icon: '⚠️', text: 'Risk assessment' },
              { icon: '💡', text: 'Smart recommendations' },
            ].map(({ icon, text }) => (
              <div key={text} className="lp__feature">
                <span className="lp__feature-icon">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Watermark */}
        <div className="lp__watermark">SLIIT Malabe · Faculty of Computing</div>
      </div>

      {/* ══════════════════ RIGHT PANEL — Premium Form ══════════════════ */}
      <div className="lp__right">
        <div className="lp__form-wrap">
          {/* Mobile Brand (Hidden on Desktop) */}
          <div className="lp__mobile-brand">
            <div className="lp__brand-icon lp__brand-icon--dark">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="6" fill="white" opacity="0.9" />
                <path d="M8 22L16 10l8 12H8z" fill="#3b82f6" />
                <circle cx="16" cy="16" r="3.5" fill="#8b5cf6" />
              </svg>
            </div>
            <span className="lp__mobile-brand-text">StudySmart</span>
          </div>

          {/* Form Header */}
          <div className="lp__form-head">
            <h2 className="lp__form-title">Welcome back</h2>
            <p className="lp__form-sub">Access your academic dashboard</p>
          </div>

          {/* Connection Status Indicator */}
          <div className={`lp__conn lp__conn--${connectionStatus}`}>
            <span className={`lp__conn-dot lp__conn-dot--${connectionStatus}`} />
            {connectionStatus === 'checking' && '🔄 Connecting to server...'}
            {connectionStatus === 'connected' && '✓ Server connected'}
            {connectionStatus === 'disconnected' && (
              <>
                ⚠️ Server offline —{' '}
                <button className="lp__conn-retry" onClick={checkConnection}>
                  retry
                </button>
              </>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="lp__error">
              <span className="lp__error-icon">⚠️</span>
              <span>{error}</span>
              <button className="lp__error-close" onClick={() => setError('')}>
                ✕
              </button>
            </div>
          )}

          {/* Login Form */}
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            className="lp__ant-form"
            initialValues={{ email: 'demo@studysmart.com', password: 'demo123' }}
          >
            {/* Email Field */}
            <Form.Item
              name="email"
              label={<span className="lp__label">📧 Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="lp__input-icon" />}
                placeholder="your.email@sliit.lk"
                size="large"
                className="lp__input"
                disabled={offline}
              />
            </Form.Item>

            {/* Password Field */}
            <Form.Item
              name="password"
              label={<span className="lp__label">🔐 Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input
                type={showPass ? 'text' : 'password'}
                prefix={<LockOutlined className="lp__input-icon" />}
                suffix={
                  <button
                    type="button"
                    className="lp__eye"
                    onClick={() => setShowPass((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                }
                placeholder="Enter your password"
                size="large"
                className="lp__input"
                disabled={offline}
              />
            </Form.Item>

            {/* Forgot Password Link */}
            <div className="lp__forgot-row">
              <button type="button" className="lp__forgot" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Form.Item style={{ marginTop: 8 }}>
              <button
                type="submit"
                className={`lp__submit${offline || loading ? ' lp__submit--disabled' : ''}`}
                disabled={offline || loading}
              >
                {loading ? (
                  <span className="lp__submit-loading">
                    <span className="lp__dot-spin" />
                    Signing in...
                  </span>
                ) : (
                  '🚀 Sign In'
                )}
              </button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div className="lp__divider">
            <span>or</span>
          </div>

          {/* Register Link */}
          <div className="lp__register">
            Don't have an account?{' '}
            <button className="lp__register-btn" onClick={() => navigate('/register')}>
              Create account →
            </button>
          </div>

          {/* Demo Credentials Box */}
          <div className="lp__demo">
            <div className="lp__demo-head">
              <span className="lp__demo-badge">DEMO</span>
              <span>Try with demo credentials</span>
            </div>
            <div className="lp__demo-row">
              <span className="lp__demo-key">Email</span>
              <code className="lp__demo-val">demo@studysmart.com</code>
            </div>
            <div className="lp__demo-row">
              <span className="lp__demo-key">Password</span>
              <code className="lp__demo-val">demo123</code>
            </div>
          </div>

          {/* Footer */}
          <p className="lp__footer">
            © {new Date().getFullYear()} StudySmart · SLIIT · Built for student success
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;