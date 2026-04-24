import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

/* ─── inline styles (no external CSS needed) ─────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: 'hidden',
    background: '#0a0f1e',
  },

  /* ── LEFT PANEL ─────────────────────────────────────────────────────────── */
  left: {
    flex: '0 0 52%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px 64px',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #0a0f1e 0%, #0d1b3e 40%, #0f2459 100%)',
  },
  leftBg: {
    position: 'absolute', inset: 0,
    backgroundImage: `url('https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.12,
  },
  leftOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(145deg, rgba(10,15,30,0.97) 0%, rgba(13,27,62,0.92) 50%, rgba(15,36,89,0.85) 100%)',
  },
  canvas: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
  },
  leftContent: {
    position: 'relative', zIndex: 2,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(99,179,237,0.12)',
    border: '1px solid rgba(99,179,237,0.3)',
    borderRadius: 30,
    padding: '6px 16px',
    marginBottom: 32,
  },
  badgeDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#63b3ed',
    boxShadow: '0 0 8px #63b3ed',
    animation: 'pulse 2s infinite',
  },
  badgeText: {
    fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: '#63b3ed',
  },
  headline: {
    fontSize: 48, fontWeight: 800, lineHeight: 1.12,
    color: '#fff', marginBottom: 20, letterSpacing: '-1px',
  },
  headlineAccent: {
    background: 'linear-gradient(90deg, #63b3ed, #9f7aea)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtext: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7, maxWidth: 420, marginBottom: 48,
  },
  featureList: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 14,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  },
  featureText: {
    fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500,
  },
  statsRow: {
    display: 'flex', gap: 32, marginTop: 56,
    paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  statItem: { textAlign: 'center' },
  statNum: {
    fontSize: 28, fontWeight: 800, color: '#fff',
    background: 'linear-gradient(90deg, #63b3ed, #9f7aea)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  statLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2,
  },

  /* ── RIGHT PANEL ─────────────────────────────────────────────────────────── */
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 48px',
    background: '#f8faff',
    overflowY: 'auto',
  },
  formWrap: {
    width: '100%', maxWidth: 420,
  },
  formHeader: {
    marginBottom: 36,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
  },
  logoBox: {
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
  },
  logoName: {
    fontSize: 18, fontWeight: 800, color: '#1e293b',
  },
  logoSub: {
    fontSize: 11, color: '#94a3b8', letterSpacing: '0.5px',
  },
  formTitle: {
    fontSize: 26, fontWeight: 800, color: '#1e293b',
    letterSpacing: '-0.5px', marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14, color: '#64748b',
  },
  label: {
    fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6,
  },
  inputWrap: {
    marginBottom: 18,
  },
  hint: {
    fontSize: 11, color: '#94a3b8', marginTop: 5,
  },
  submitBtn: {
    width: '100%', height: 50,
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, color: '#fff',
    cursor: 'pointer', marginTop: 8,
    boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '22px 0',
  },
  dividerLine: {
    flex: 1, height: 1, background: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12, color: '#94a3b8', fontWeight: 500,
  },
  demoBox: {
    background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
    border: '1px solid #dbeafe',
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  demoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  demoCredRow: {
    fontSize: 11, color: '#64748b', marginBottom: 2,
  },
  demoCredVal: {
    fontWeight: 700, color: '#1e293b', fontFamily: 'monospace',
  },
  footerText: {
    textAlign: 'center', marginTop: 24,
    fontSize: 13, color: '#64748b',
  },
  footerLink: {
    color: '#2563eb', fontWeight: 700, textDecoration: 'none',
  },
};

/* ─── Animated particle canvas ───────────────────────────────────────────── */
const ParticleCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width  = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.5 + 0.15,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,237,${d.a})`;
        ctx.fill();
      });
      // connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ ...S.canvas, width: '100%', height: '100%' }} />;
};

/* ─── Password strength ───────────────────────────────────────────────────── */
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#10b981'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score] : '#e2e8f0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{label}</span>
    </div>
  );
};

/* ─── Styled input wrapper ────────────────────────────────────────────────── */
const FieldInput = ({ label, hint, children }) => (
  <div style={S.inputWrap}>
    <label style={S.label}>{label}</label>
    {children}
    {hint && <div style={S.hint}>{hint}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [password, setPassword] = useState('');
  const [btnHover, setBtnHover] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateSLIITEmail = (email) =>
    /^IT\d{8}@my\.sliit\.lk$/i.test(email);

  const onFinish = async (values) => {
    setError('');
    if (!validateSLIITEmail(values.email)) {
      setError('Use your SLIIT email format: IT12345678@my.sliit.lk');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        name:      values.name,
        email:     values.email,
        password:  values.password,
        studentId: values.email.split('@')[0].toUpperCase(),
      });
      if (result.success) {
        setSuccess(true);
        toast.success('Account created! Welcome to StudySmart 🎉');
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        toast.error(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '📊', color: 'rgba(99,179,237,0.15)', text: 'AI-powered performance prediction' },
    { icon: '📈', color: 'rgba(159,122,234,0.15)', text: 'Real-time analytics from your marks' },
    { icon: '🎯', color: 'rgba(52,211,153,0.15)',  text: 'Smart study recommendations' },
    { icon: '📤', color: 'rgba(251,146,60,0.15)',   text: 'Upload marks in Excel or PDF' },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
        .reg-left-item { animation: fadeUp 0.6s ease both; }
        .reg-left-item:nth-child(1){animation-delay:0.05s}
        .reg-left-item:nth-child(2){animation-delay:0.15s}
        .reg-left-item:nth-child(3){animation-delay:0.25s}
        .reg-left-item:nth-child(4){animation-delay:0.35s}
        .reg-left-item:nth-child(5){animation-delay:0.45s}
        .reg-left-item:nth-child(6){animation-delay:0.55s}
        .reg-form-wrap { animation: slideIn 0.5s ease both; animation-delay: 0.1s; }
        .ant-input-affix-wrapper {
          border-radius: 10px !important;
          border: 1.5px solid #e2e8f0 !important;
          height: 46px !important;
          font-size: 14px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          background: #fff !important;
        }
        .ant-input-affix-wrapper:hover,
        .ant-input-affix-wrapper-focused {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
        }
        .ant-input-prefix { color: #94a3b8 !important; margin-right: 8px !important; }
        .ant-form-item { margin-bottom: 0 !important; }
        .ant-form-item-explain-error { font-size: 11px !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* ── LEFT ── */}
      <div style={S.left}>
        <div style={S.leftBg} />
        <div style={S.leftOverlay} />
        <ParticleCanvas />

        <div style={S.leftContent}>
          {/* Badge */}
          <div className="reg-left-item" style={S.badge}>
            <div style={S.badgeDot} />
            <span style={S.badgeText}>SLIIT Student Portal</span>
          </div>

          {/* Headline */}
          <h1 className="reg-left-item" style={S.headline}>
            Track. Analyse.<br />
            <span style={S.headlineAccent}>Excel.</span>
          </h1>

          <p className="reg-left-item" style={S.subtext}>
            StudySmart turns your uploaded marks into intelligent insights —
            so you always know where you stand and what to do next.
          </p>

          {/* Features */}
          <div className="reg-left-item" style={S.featureList}>
            {features.map((f, i) => (
              <div key={i} style={S.featureItem}>
                <div style={{ ...S.featureIcon, background: f.color }}>
                  {f.icon}
                </div>
                <span style={S.featureText}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="reg-left-item" style={S.statsRow}>
            {[
              { num: '4+',   label: 'Year Groups' },
              { num: '20+',  label: 'Subjects Tracked' },
              { num: '100%', label: 'Free to Use' },
            ].map((s, i) => (
              <div key={i} style={S.statItem}>
                <div style={S.statNum}>{s.num}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div style={S.right}>
        <div className="reg-form-wrap" style={S.formWrap}>

          {/* Logo row */}
          <div style={S.logoRow}>
            <div style={S.logoBox}>🎓</div>
            <div>
              <div style={S.logoName}>StudySmart</div>
              <div style={S.logoSub}>SLIIT PERFORMANCE TRACKER</div>
            </div>
          </div>

          {/* Form header */}
          <div style={S.formHeader}>
            <div style={S.formTitle}>Create your account</div>
            <div style={S.formSubtitle}>Join with your SLIIT student email</div>
          </div>

          {/* Error */}
          {error && (
            <Alert message={error} type="error" showIcon closable
              onClose={() => setError('')}
              style={{ marginBottom: 20, borderRadius: 10, fontSize: 13 }} />
          )}

          {/* Success */}
          {success && (
            <Alert
              message="Account created! Redirecting to dashboard…"
              type="success" showIcon
              style={{ marginBottom: 20, borderRadius: 10, fontSize: 13 }} />
          )}

          <Form form={form} onFinish={onFinish} disabled={loading || success}>

            {/* Full Name */}
            <FieldInput label="Full Name">
              <Form.Item name="name"
                rules={[{ required: true, message: 'Please enter your full name' }]}>
                <Input prefix={<UserOutlined />} placeholder="T.M.N.V Asipath" size="large" />
              </Form.Item>
            </FieldInput>

            {/* Email */}
            <FieldInput
              label="SLIIT Student Email"
              hint="Format: IT12345678@my.sliit.lk">
              <Form.Item name="email" rules={[
                { required: true, message: 'Email is required' },
                { pattern: /^IT\d{8}@my\.sliit\.lk$/i, message: 'Must be IT12345678@my.sliit.lk' },
              ]}>
                <Input prefix={<MailOutlined />} placeholder="IT12345678@my.sliit.lk" size="large"
                  style={{ textTransform: 'lowercase' }} />
              </Form.Item>
            </FieldInput>

            {/* Password */}
            <FieldInput label="Password">
              <Form.Item name="password" rules={[
                { required: true, message: 'Password is required' },
                { min: 6, message: 'At least 6 characters' },
              ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Min. 6 characters"
                  size="large" onChange={e => setPassword(e.target.value)} />
              </Form.Item>
              <PasswordStrength password={password} />
            </FieldInput>

            {/* Confirm Password */}
            <FieldInput label="Confirm Password">
              <Form.Item name="confirmPassword" dependencies={['password']} rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Re-enter password" size="large" />
              </Form.Item>
            </FieldInput>

            {/* Submit */}
            <Form.Item style={{ marginTop: 8 }}>
              <button
                type="submit"
                style={{
                  ...S.submitBtn,
                  transform: btnHover ? 'translateY(-1px)' : 'none',
                  boxShadow: btnHover
                    ? '0 8px 28px rgba(37,99,235,0.5)'
                    : '0 4px 20px rgba(37,99,235,0.4)',
                  opacity: loading ? 0.8 : 1,
                }}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Creating account…
                  </>
                ) : success ? (
                  <><CheckCircleOutlined /> Done!</>
                ) : (
                  'Create Account →'
                )}
              </button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>Demo Admin</span>
            <div style={S.dividerLine} />
          </div>

          {/* Demo box */}
          <div style={S.demoBox}>
            <div style={S.demoIcon}>👤</div>
            <div>
              <div style={S.demoCredRow}>
                Email: <span style={S.demoCredVal}>admin@nidu.sliit.lk</span>
              </div>
              <div style={S.demoCredRow}>
                Password: <span style={S.demoCredVal}>nidu@123</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={S.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={S.footerLink}>Sign in</Link>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#cbd5e1', letterSpacing: '0.5px' }}>
              🔒 SLIIT STUDENT DATA IS ENCRYPTED &amp; PRIVATE
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RegisterPage;