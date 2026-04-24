// frontend/src/components/profile/ProfileCompletionForm.jsx
import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, Progress, Tag, Space, message } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Option } = Select;

const ProfileCompletionForm = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [completion, setCompletion] = useState(calculateCompletion(user));

  function calculateCompletion(userData) {
    const fields = [
      'name', 'email', 'studentNumber', 'program', 
      'year', 'studyHoursPerDay', 'learningStyle', 'subjects'
    ];
    const completed = fields.filter(f => userData[f]).length;
    return Math.round((completed / fields.length) * 100);
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Update profile
      message.success('Profile updated successfully!');
      setCompletion(calculateCompletion({...user, ...values}));
      if (onUpdate) onUpdate(values);
    } catch (error) {
      message.error('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <Card title="Complete Your Profile" className="profile-form">
      <div style={{ marginBottom: 24 }}>
        <Progress percent={completion} status={completion === 100 ? 'success' : 'active'} />
        <Space style={{ marginTop: 8 }}>
          {completion < 100 ? (
            <Tag icon={<WarningOutlined />} color="warning">Incomplete Profile</Tag>
          ) : (
            <Tag icon={<CheckCircleOutlined />} color="success">Profile Complete</Tag>
          )}
          <span>{completion}% complete</span>
        </Space>
      </div>

      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={user}
      >
        <Form.Item
          name="studentNumber"
          label="Student Number"
          rules={[{ required: true }]}
        >
          <Input placeholder="e.g., STU2024001" />
        </Form.Item>

        <Form.Item
          name="program"
          label="Program"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select your program">
            <Option value="cs">Computer Science</Option>
            <Option value="eng">Engineering</Option>
            <Option value="business">Business</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="year"
          label="Year of Study"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select year">
            <Option value="1">1st Year</Option>
            <Option value="2">2nd Year</Option>
            <Option value="3">3rd Year</Option>
            <Option value="4">4th Year</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="studyHoursPerDay"
          label="Average Study Hours Per Day"
          rules={[{ required: true }]}
        >
          <Input type="number" min={0} max={24} step={0.5} />
        </Form.Item>

        <Form.Item
          name="learningStyle"
          label="Learning Style"
          rules={[{ required: true }]}
        >
          <Select placeholder="How do you learn best?">
            <Option value="visual">Visual Learner</Option>
            <Option value="auditory">Auditory Learner</Option>
            <Option value="reading">Reading/Writing</Option>
            <Option value="kinesthetic">Hands-on Learner</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="subjects"
          label="Current Subjects"
        >
          <Select mode="multiple" placeholder="Select your subjects">
            <Option value="database">Database Systems</Option>
            <Option value="dsa">Data Structures</Option>
            <Option value="algorithms">Algorithms</Option>
            <Option value="os">Operating Systems</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Update Profile
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfileCompletionForm;