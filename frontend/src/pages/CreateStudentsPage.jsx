import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserAddOutlined, MailOutlined, LockOutlined, UserOutlined, CheckCircleFilled, SafetyOutlined } from '@ant-design/icons';
import axios from 'axios';
import './CreateStudentPage.css';

/* ── password strength helper ── */
const getStrength = (pwd) => {
  if (!pwd || pwd.length < 4) return { level: 0, label: '', cls: '' };
  if (pwd.length < 7)         return { level: 1, label: 'Weak',   cls: 'weak' };
  if (pwd.length < 10 || !/[^a-zA-Z0-9]/.test(pwd)) return { level: 2, label: 'Medium', cls: 'medium' };
  return { level: 3, label: 'Strong', cls: 'strong' };
};

/* ── floating-label input wrapper ── */
const FloatingInput = ({ name, label, icon, rules, children, form }) => {
  const value  = Form.useWatch(name, form);
  const raised = !!(value && String(value).length > 0);
  return (
    <div className={`fl-group${raised ? ' raised' : ''}`}>
      <Form.Item name={name} style={{ margin: 0 }} rules={rules}>
        {React.cloneElement(children, {
          prefix: React.cloneElement(icon, { style: { color: 'rgba(255,255,255,0.22)', fontSize: 15 } }),
        })}
      </Form.Item>
      <span className="fl-label">{label}</span>
    </div>
  );
};

const CreateStudentsPage = () => {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  const watchedName     = Form.useWatch('name',     form);
  const watchedEmail    = Form.useWatch('email',    form);
  const watchedPassword = Form.useWatch('password', form);
  const strength        = getStrength(watchedPassword || '');

  const initials = watchedName
    ? watchedName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarPalette = [
    ['#6366f1', '#4f46e5'],
    ['#0ea5e9', '#0284c7'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ec4899', '#db2777'],
  ];
  const colorPair = watchedName
    ? avatarPalette[watchedName.charCodeAt(0) % avatarPalette.length]
    : ['#1e293b', '#0f172a'];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        ...values,
        role: 'student',
      });
      if (response.data.token) {
        message.success('Student account created successfully!');
        form.resetFields();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create student account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csp-page">

      {/* glow blobs */}
      <div className="csp-blob csp-blob-1" />
      <div className="csp-blob csp-blob-2" />
      <div className="csp-blob csp-blob-3" />

      {/* ── Left info panel ── */}
      <div className="csp-left">
        <div className="csp-badge">
          <span className="csp-badge-dot" />
          <span className="csp-badge-text">Admin Portal</span>
        </div>

        <h1 className="csp-heading">Add a New<br />Student Account</h1>

        <p className="csp-subtext">
          Register students to the StudySmart platform so they can access
          subjects, track sessions, and monitor their academic progress.
        </p>

        <ul className="csp-feature-list">
          {[
            { title: 'Instant Access',     text: 'Students can log in immediately after registration.' },
            { title: 'Subject Assignment', text: 'Assign subjects from the Session Tracker page.' },
            { title: 'Admin-set Password', text: 'Students use the password you set — no changes needed.' },
          ].map(({ title, text }) => (
            <li key={title} className="csp-feature-item">
              <CheckCircleFilled className="csp-feature-icon" />
              <div>
                <span className="csp-feature-title">{title}</span>
                <span className="csp-feature-text">{text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form panel ── */}
      <div className="csp-right">

        {/* profile preview */}
        <div className="csp-profile-preview">
          <div
            className="csp-avatar"
            style={{ background: `linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})` }}
          >
            {initials}
          </div>
          <div className="csp-profile-meta">
            <p className="csp-profile-name">{watchedName?.trim() || 'New Student'}</p>
            <p className="csp-profile-email">{watchedEmail?.trim() || 'email not set'}</p>
            <span className="csp-role-pill">
              <span className="csp-role-dot" />
              Student
            </span>
          </div>
        </div>

        {/* section label */}
        <p className="csp-form-label">Registration Details</p>

        <Form form={form} onFinish={onFinish} requiredMark={false}>

          <FloatingInput
            name="name" label="Full Name"
            icon={<UserOutlined />}
            rules={[{ required: true, message: 'Please enter student name' }]}
            form={form}
          >
            <Input placeholder="Full Name" />
          </FloatingInput>

          <FloatingInput
            name="email" label="Email Address"
            icon={<MailOutlined />}
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Invalid email address' },
            ]}
            form={form}
          >
            <Input placeholder="Email Address" />
          </FloatingInput>

          <FloatingInput
            name="password" label="Password"
            icon={<LockOutlined />}
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 6, message: 'Minimum 6 characters' },
            ]}
            form={form}
          >
            <Input.Password placeholder="Password" />
          </FloatingInput>

          {/* password strength */}
          {watchedPassword && (
            <div className="csp-strength-wrap">
              <div className="strength-bar-wrap">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`strength-segment${i <= strength.level ? ` ${strength.cls}` : ''}`} />
                ))}
              </div>
              {strength.label && (
                <span className={`strength-label ${strength.cls}`}>{strength.label} password</span>
              )}
            </div>
          )}

          <Form.Item style={{ margin: '20px 0 0 0' }}>
            <div className="submit-btn-wrap">
              <Button type="primary" htmlType="submit" loading={loading} icon={<UserAddOutlined />}>
                Register Student
              </Button>
            </div>
          </Form.Item>
        </Form>

        <p className="csp-note">
          <SafetyOutlined style={{ marginRight: 6, color: '#6366f1' }} />
          Students log in using the password you set here. No changes required.
        </p>
      </div>
    </div>
  );
};

export default CreateStudentsPage;
