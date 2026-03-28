// frontend/src/components/study/StudySessionForm.jsx
import React, { useState } from 'react';
import { Form, Input, DatePicker, Button, Card, Select, Slider, Rate, Space, message } from 'antd';
import { ClockCircleOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const StudySessionForm = ({ onSessionAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const subjects = [
    'Database Systems',
    'Data Structures',
    'Algorithms',
    'Operating Systems',
    'Computer Networks',
    'Machine Learning',
    'Web Development',
    'Mathematics'
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Send to backend
      console.log('Study session:', values);
      message.success('Study session logged successfully!');
      form.resetFields();
      if (onSessionAdded) onSessionAdded();
    } catch (error) {
      message.error('Failed to log session');
    }
    setLoading(false);
  };

  return (
    <Card title="Log Study Session" className="study-session-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ productivity: 3 }}
      >
        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, message: 'Please select a subject' }]}
        >
          <Select placeholder="Select subject" size="large">
            {subjects.map(subject => (
              <Option key={subject} value={subject}>{subject}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please select date' }]}
        >
          <DatePicker style={{ width: '100%' }} size="large" />
        </Form.Item>

        <Form.Item
          name="hoursStudied"
          label="Hours Studied"
          rules={[{ required: true, message: 'Please enter hours' }]}
        >
          <Slider
            min={0.5}
            max={12}
            step={0.5}
            marks={{
              0.5: '0.5h',
              3: '3h',
              6: '6h',
              9: '9h',
              12: '12h'
            }}
          />
        </Form.Item>

        <Form.Item
          name="topics"
          label="Topics Covered"
        >
          <Select
            mode="tags"
            placeholder="Enter topics (press enter after each)"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="productivity"
          label="Productivity Level"
        >
          <Rate character={<TrophyOutlined />} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <TextArea rows={4} placeholder="What did you learn? Any difficulties?" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Log Study Session
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StudySessionForm;