import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

/* ── animated counter ── */
const Counter = ({ to, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 40);
    const t = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(start);
      if (start >= to) clearInterval(t);
    }, 35);
    return () => clearInterval(t);
  }, [to]);
  return <span>{val.toLocaleString()}{suffix}</span>;
};

const LoginPage = () => {
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');
  const [connectionStatus,  setConnectionStatus]  = useState('checking');
  const [showPass,          setShowPass]          = useState(false);
  const [imgLoaded,         setImgLoaded]         = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => { checkConn(); }, []);

  const checkConn = async () => {
    try {
      const r = await fetch('http://localhost:5000/health');
      setConnectionStatus(r.ok ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || result.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const offline = connectionStatus === 'disconnected';

  return (
    <div className="lp">

      {/* ══════════════════ LEFT PANEL — campus photo ══════════════════ */}
      <div className="lp__left">
        {/* campus image */}
        <img
          src="/images/SLIIT-malabe.jpg"
          alt="SLIIT Malabe Campus"
          className={`lp__campus${imgLoaded ? ' lp__campus--loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
          onError={e => { e.target.style.display = 'none'; }}
        />

        {/* layered overlays for depth */}
        <div className="lp__overlay lp__overlay--dark"/>
        <div className="lp__overlay lp__overlay--grad"/>
        <div className="lp__overlay lp__overlay--vignette"/>

        {/* content on top of image */}
        <div className="lp__left-content">
          {/* brand */}
          <div className="lp__brand">
            <div className="lp__brand-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="rgba(255,255,255,0.15)"/>
                <path d="M6 20L14 8l8 12H6z" fill="white" opacity="0.9"/>
                <circle cx="14" cy="14" r="3" fill="white"/>
              </svg>
            </div>
            <span className="lp__brand-name">StudySmart</span>
          </div>

          {/* headline */}
          <div className="lp__headline">
            <div className="lp__tag">SLIIT · Malabe Campus</div>
            <h1 className="lp__h1">
              Track your<br/>
              <span className="lp__h1-accent">academic journey</span><br/>
              intelligently.
            </h1>
            <p className="lp__desc">
              Upload marks, analyse performance, predict outcomes — all in one intelligent platform built for SLIIT students.
            </p>
          </div>

          {/* stat cards */}
          <div className="lp__stats">
            {[
              { icon: '📊', label: 'Assessments Tracked', val: 1200, suffix: '+' },
              { icon: '🎓', label: 'Students Active',     val: 340,  suffix: '+' },
              { icon: '📈', label: 'Avg GPA Improvement', val: 0.4,  suffix: ' pts' },
            ].map(({ icon, label, val, suffix }) => (
              <div key={label} className="lp__stat">
                <div className="lp__stat-icon">{icon}</div>
                <div className="lp__stat-val">
                  <Counter to={val} suffix={suffix}/>
                </div>
                <div className="lp__stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* features */}
          <div className="lp__features">
            {[
              'AI-powered grade predictions',
              'Real-time performance analytics',
              'Subject-wise risk assessment',
              'Smart study recommendations',
            ].map(f => (
              <div key={f} className="lp__feature">
                <span className="lp__feature-dot"/>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* bottom watermark */}
        <div className="lp__watermark">SLIIT Malabe · Faculty of Computing</div>
      </div>

      {/* ══════════════════ RIGHT PANEL — login form ══════════════════ */}
      <div className="lp__right">
        <div className="lp__form-wrap">

          {/* mobile brand (hidden on desktop) */}
          <div className="lp__mobile-brand">
            <div className="lp__brand-icon lp__brand-icon--dark">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#2563eb"/>
                <path d="M6 20L14 8l8 12H6z" fill="white" opacity="0.9"/>
                <circle cx="14" cy="14" r="3" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight:800, fontSize:18, color:'#0f172a' }}>StudySmart</span>
          </div>

          {/* heading */}
          <div className="lp__form-head">
            <h2 className="lp__form-title">Welcome back</h2>
            <p className="lp__form-sub">Sign in to your student dashboard</p>
          </div>

          {/* server status */}
          <div className={`lp__conn lp__conn--${connectionStatus}`}>
            <span className={`lp__conn-dot lp__conn-dot--${connectionStatus}`}/>
            {connectionStatus === 'checking'      && 'Connecting to server…'}
            {connectionStatus === 'connected'     && 'Server connected'}
            {connectionStatus === 'disconnected'  && (
              <>Server offline —&nbsp;
                <button className="lp__conn-retry" onClick={checkConn}>retry</button>
              </>
            )}
          </div>

          {/* error */}
          {error && (
            <div className="lp__error">
              <span>⚠</span>
              <span>{error}</span>
              <button className="lp__error-close" onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* form */}
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            className="lp__ant-form"
            initialValues={{ email: 'demo@studysmart.com', password: 'demo123' }}
          >
            <Form.Item
              name="email"
              label={<span className="lp__label">Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email',  message: 'Enter a valid email address' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="lp__input-icon"/>}
                placeholder="your.email@sliit.lk"
                size="large"
                className="lp__input"
                disabled={offline}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="lp__label">Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input
                type={showPass ? 'text' : 'password'}
                prefix={<LockOutlined className="lp__input-icon"/>}
                suffix={
                  <button
                    type="button"
                    className="lp__eye"
                    onClick={() => setShowPass(p => !p)}
                  >
                    {showPass ? <EyeInvisibleOutlined/> : <EyeOutlined/>}
                  </button>
                }
                placeholder="Enter your password"
                size="large"
                className="lp__input"
                disabled={offline}
              />
            </Form.Item>

            {/* forgot password row */}
            <div className="lp__forgot-row">
              <button type="button" className="lp__forgot">Forgot password?</button>
            </div>

            <Form.Item style={{ marginTop: 8 }}>
              <button
                type="submit"
                className={`lp__submit${offline ? ' lp__submit--disabled' : ''}`}
                disabled={offline || loading}
              >
                {loading ? (
                  <span className="lp__submit-loading">
                    <span className="lp__dot-spin"/>
                    Signing in…
                  </span>
                ) : 'Sign In →'}
              </button>
            </Form.Item>
          </Form>

          {/* divider */}
          <div className="lp__divider"><span>or</span></div>

          {/* register */}
          <div className="lp__register">
            Don't have an account?{' '}
            <button className="lp__register-btn" onClick={() => navigate('/register')}>
              Create account
            </button>
          </div>

          {/* demo box */}
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

          {/* footer */}
          <p className="lp__footer">
            © {new Date().getFullYear()} StudySmart · SLIIT · Built for students
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;