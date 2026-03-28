// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, Steps, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Option } = Select;
const { Title, Text } = Typography;

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Academic Info
    studentNumber: '',
    program: '',
    year: '',
    semester: '',
    subjects: [],
    
    // Step 3: Study Preferences
    studyHoursPerDay: '',
    preferredStudyTime: 'morning',
    learningStyle: '',
    goals: ''
  });

  const steps = [
    {
      title: 'Account',
      content: (
        <div className="step-content">
          <Title level={4}>Create Your Account</Title>
          <Form layout="vertical">
            <Form.Item label="Full Name" required>
              <Input 
                prefix={<UserOutlined />}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Email" required>
              <Input 
                prefix={<MailOutlined />}
                placeholder="john@example.com"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Password" required>
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Confirm Password" required>
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      title: 'Academic',
      content: (
        <div className="step-content">
          <Title level={4}>Academic Information</Title>
          <Form layout="vertical">
            <Form.Item label="Student Number" required>
              <Input 
                placeholder="STU2024001"
                value={formData.studentNumber}
                onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Program" required>
              <Select 
                placeholder="Select your program"
                value={formData.program}
                onChange={(value) => setFormData({...formData, program: value})}
              >
                <Option value="cs">Computer Science</Option>
                <Option value="eng">Engineering</Option>
                <Option value="business">Business</Option>
                <Option value="medicine">Medicine</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Year" required>
              <Select 
                placeholder="Select year"
                value={formData.year}
                onChange={(value) => setFormData({...formData, year: value})}
              >
                <Option value="1">1st Year</Option>
                <Option value="2">2nd Year</Option>
                <Option value="3">3rd Year</Option>
                <Option value="4">4th Year</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Current Semester">
              <Select 
                placeholder="Select semester"
                value={formData.semester}
                onChange={(value) => setFormData({...formData, semester: value})}
              >
                <Option value="1">Semester 1</Option>
                <Option value="2">Semester 2</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Current Subjects">
              <Select 
                mode="multiple"
                placeholder="Select your subjects"
                value={formData.subjects}
                onChange={(value) => setFormData({...formData, subjects: value})}
              >
                <Option value="database">Database Systems</Option>
                <Option value="dsa">Data Structures</Option>
                <Option value="algorithms">Algorithms</Option>
                <Option value="os">Operating Systems</Option>
                <Option value="networks">Computer Networks</Option>
                <Option value="ml">Machine Learning</Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      title: 'Preferences',
      content: (
        <div className="step-content">
          <Title level={4}>Study Preferences</Title>
          <Form layout="vertical">
            <Form.Item label="Average Study Hours Per Day">
              <Input 
                type="number"
                placeholder="e.g., 4"
                value={formData.studyHoursPerDay}
                onChange={(e) => setFormData({...formData, studyHoursPerDay: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Preferred Study Time">
              <Select 
                value={formData.preferredStudyTime}
                onChange={(value) => setFormData({...formData, preferredStudyTime: value})}
              >
                <Option value="morning">Morning (6 AM - 12 PM)</Option>
                <Option value="afternoon">Afternoon (12 PM - 6 PM)</Option>
                <Option value="evening">Evening (6 PM - 12 AM)</Option>
                <Option value="night">Night (12 AM - 6 AM)</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Learning Style">
              <Select 
                value={formData.learningStyle}
                onChange={(value) => setFormData({...formData, learningStyle: value})}
              >
                <Option value="visual">Visual (diagrams, charts)</Option>
                <Option value="auditory">Auditory (listening, discussions)</Option>
                <Option value="reading">Reading/Writing</Option>
                <Option value="kinesthetic">Hands-on practice</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Academic Goals">
              <Input.TextArea 
                rows={4}
                placeholder="What do you want to achieve?"
                value={formData.goals}
                onChange={(e) => setFormData({...formData, goals: e.target.value})}
              />
            </Form.Item>
          </Form>
        </div>
      )
    }
  ];

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    // Submit to backend
    message.success('Registration successful!');
  };

  return (
    <Card style={{ maxWidth: 600, margin: '40px auto' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Join StudySmart</Title>
      <Steps current={currentStep} style={{ margin: '30px 0' }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      
      <div className="steps-content">{steps[currentStep].content}</div>
      
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        {currentStep > 0 && (
          <Button style={{ marginRight: 8 }} onClick={prev}>
            Previous
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={next}>
            Next
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button type="primary" onClick={handleSubmit}>
            Register
          </Button>
        )}
      </div>
    </Card>
  );
};

export default RegisterPage;