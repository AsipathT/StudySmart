// frontend/src/components/quiz/QuizScoreForm.jsx
import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, InputNumber, DatePicker, Upload, message } from 'antd';
import { UploadOutlined, FilePdfOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const QuizScoreForm = ({ onScoreAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const subjects = [
    'Database Systems',
    'Data Structures',
    'Algorithms',
    'Operating Systems',
    'Computer Networks',
    'Machine Learning',
    'Web Development'
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Send to backend
      console.log('Quiz score:', values);
      message.success('Score added successfully!');
      form.resetFields();
      setFileList([]);
      if (onScoreAdded) onScoreAdded();
    } catch (error) {
      message.error('Failed to add score');
    }
    setLoading(false);
  };

  const uploadProps = {
    onRemove: (file) => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <Card title="Add Quiz/Exam Score" className="quiz-score-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
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
          name="type"
          label="Assessment Type"
          rules={[{ required: true, message: 'Please select type' }]}
        >
          <Select placeholder="Select type" size="large">
            <Option value="quiz">Quiz</Option>
            <Option value="midterm">Midterm Exam</Option>
            <Option value="final">Final Exam</Option>
            <Option value="assignment">Assignment</Option>
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
          name="score"
          label="Score (%)"
          rules={[{ required: true, message: 'Please enter score' }]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            size="large"
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
          />
        </Form.Item>

        <Form.Item
          name="maxScore"
          label="Maximum Score"
        >
          <InputNumber
            min={1}
            max={100}
            style={{ width: '100%' }}
            size="large"
            placeholder="e.g., 100"
          />
        </Form.Item>

        <Form.Item
          name="feedback"
          label="Teacher Feedback"
        >
          <TextArea rows={3} placeholder="Any feedback from teacher?" />
        </Form.Item>

        <Form.Item label="Upload Answer Sheet">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select File (PDF)</Button>
          </Upload>
          <small>Upload your graded paper for better analysis</small>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Add Score
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default QuizScoreForm;