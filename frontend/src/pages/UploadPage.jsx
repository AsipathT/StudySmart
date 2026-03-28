import React, { useState, useCallback, useEffect } from 'react';
import {
  Card, Button, Row, Col, Spin, Alert, Space, Typography,
  Progress, Table, Tag, Statistic, Empty, Modal, Descriptions,
  Timeline, Tooltip, Form, Input, Select, Radio, Steps, Divider,
} from 'antd';
import {
  UploadOutlined, FilePdfOutlined, FileExcelOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  HistoryOutlined, BarChartOutlined, DeleteOutlined, EyeOutlined,
  DownloadOutlined, ReloadOutlined, UserOutlined, IdcardOutlined,
  BankOutlined, ArrowRightOutlined, ArrowLeftOutlined,
  CloudUploadOutlined, CheckOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import uploadService from '../services/upload.service';
import './UploadPage.css';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANCHES = [
  { value: 'kandy',       label: 'Kandy' },
  { value: 'malabe',      label: 'Malabe' },
  { value: 'jaffna',      label: 'Jaffna' },
  { value: 'matara',      label: 'Matara' },
  { value: 'kollupitiya', label: 'Kollupitiya' },
  { value: 'ccu',         label: 'Colombo City Uni' },
];

const ACADEMIC_YEARS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

const PROGRAMS = [
  "B.Sc (Hons) Information Technology",
  "B.Sc (Hons) Software Engineering"
];

const SUBJECTS = {
  "B.Sc (Hons) Information Technology": {
    1: {
      1: [
        "IT1180 - Effective Academic Communication",
        "IT1140 - Fundamentals of Computing",
        "IT1130 - Mathematics for Computing",
        "IT1120 - Introduction to Programming",
        "IE1030 - Data Communication Networks"
      ],
      2: [
        "SE1020 - Object Oriented Programming",
        "IT1170 - Data Structures and Algorithms",
        "IT1160 - Discrete Mathematics",
        "IT1150 - Technical Writing"
      ]
    },
    2: {
      1: [
        "SE2030 - Software Engineering",
        "IT2140 - Database Design and Development",
        "IT2120 - Probability and Statistics",
        "IT2011 - Artficial Intelligence and Machine Learning"
      ],
      2: [
        "SE2020 - Web and Mobile Technology",
        "IT2160 - Professional Skills",
        "IT2150 - IT Project",
        "IT2130 - Operating Systems and System Administration"
      ]
    },
    3: {
      1: [
        "IT3050 - Employability Skills Development - Seminar",
        "IT3040 - IT Project Management",
        "IT3030 - Programming Applications and Frameworks",
        "IT3020 - Database Systems",
        "IT3010 - Network Design and Management"
      ],
      2: [
        "IT3090 - Bussiness Management for IT",
        "IT3080 - Data Science & Analytics",
        "IT3070 - Information Assurance & Security",
        "IT3060 - Human Computer Interaction"
      ]
    },
    4: {
      1: [
        "Research Project (Comprehensive Design and Analysis Project ) - IT4010",
        "IT4140 - Industry Placement - 6 Months",
        "IT4130 - Image Understanding & Processing",
        "IT4110 - Computer Systems and Network Administration",
        "IT4100 - Software Quality Assurance",
        "IT4070 - Preparation for the Professional World",
        "IT4060 - Machine Learning",
        "IT4020 - Modern Topics in IT",
        "IE4040 - Information Assurance and Auditing"
      ],
      2: [
        "IT4140 - Industry Placement - 6 Months",
        "IT4130 - Image Understanding & Processing",
        "IT4110 - Computer Systems and Network Administration",
        "IT4100 - Software Quality Assurance",
        "IT4070 - Preparation for the Professional World",
        "IT4060 - Machine Learning",
        "IT4020 - Modern Topics in IT",
        "IT4010 - Research Project",
        "IE4040 - Information Assurance and Auditing"
      ]
    }
  },
  "B.Sc (Hons) Software Engineering": {
    3: {
      1: [
        "SE3040 - Application Frameworks",
        "SE3030 - Software Architecture",
        "SE3020 - Distributed Systems",
        "SE3010 - Software Engineering Process & Quality Management",
        "IT3050 - Employability Skills Development - Seminar"
      ],
      2: [
        "SE3080 - Software Project Management",
        "SE3070 - Case Studies in Software Engineering",
        "SE3060 - Database Systems",
        "SE3050 - User Experience Engineering"
      ]
    },
    4: {
      1: [
        "Research Project (Comprehensive Design and Analysis Project )",
        "SE4020 - Mobile Application Design and Development",
        "SE4010 - Current Trends in Software Engineering",
        "IT4140 - Industry Placement - 6 Months",
        "IT4130 - Image Understanding & Processing",
        "IT4070 - Preparation for the Professional World",
        "IT4060 - Machine Learning"
      ],
      2: [
        "SE4050 - Deep Learning",
        "SE4040 - Enterprise Application Development",
        "SE4030 - Secure Software Development",
        "IT4140 - Industry Placement - 6 Months",
        "IT4010 - Research Project",
        "IE4060 - Robotics & Intelligent Systems"
      ]
    }
  }
};

const subjectToSemester = {};
Object.keys(SUBJECTS).forEach(program => {
  Object.keys(SUBJECTS[program]).forEach(year => {
    Object.keys(SUBJECTS[program][year]).forEach(sem => {
      SUBJECTS[program][year][sem].forEach(subject => {
        subjectToSemester[subject] = parseInt(sem);
      });
    });
  });
});

// ─── Helper: strip all whitespace + uppercase for ID comparison ───────────────
// "IT 23 1458 70" → "IT23145870"
const normalizeId = (val) => String(val || '').replace(/\s+/g, '').toUpperCase();

// ─── File icon helper ─────────────────────────────────────────────────────────
const FileIcon = ({ fileName }) => {
  if (!fileName) return <CloudUploadOutlined style={{ fontSize: 40, color: '#1890ff' }} />;
  if (fileName.endsWith('.pdf'))
    return <FilePdfOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />;
  return <FileExcelOutlined style={{ fontSize: 40, color: '#52c41a' }} />;
};

// ─── Step 1: Student Info ─────────────────────────────────────────────────────
const StudentInfoForm = ({ form, onNext }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const handleNext = async () => {
    try {
      await form.validateFields(['fullName','studentId','courseProgram','academicYear','semester','branch']);
      onNext();
    } catch (_) {}
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <UserOutlined className="step-icon" />
        <div>
          <Title level={4} style={{ margin: 0 }}>Student Information</Title>
          <Text type="secondary">Fill in your details before uploading your marks file.</Text>
        </div>
      </div>
      <Divider />
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="fullName" label="Full Name"
          rules={[{ required: true, message: 'Please enter your full name' }]}>
          <Input prefix={<UserOutlined />} placeholder="e.g. John Doe" size="large" />
        </Form.Item>
        <Form.Item name="studentId" label="Student ID"
          rules={[
            { required: true, message: 'Please enter your student ID' },
            {
              validator: (_, value) => {
                const normalized = normalizeId(value);
                if (!/^IT\d{8}$/.test(normalized)) {
                  return Promise.reject(new Error('Student ID must be in the format ITxxxxxxxx (IT followed by 8 digits)'));
                }
                return Promise.resolve();
              }
            }
          ]}>
          <Input prefix={<IdcardOutlined />} placeholder="IT23145870" size="large" />
        </Form.Item>
        <Form.Item name="courseProgram" label="Course Program"
          rules={[{ required: true, message: 'Please select your course program' }]}>
          <Select size="large" placeholder="Select program" onChange={(value) => { setSelectedProgram(value); setSelectedYear(null); }}>
            {PROGRAMS.map(p => <Option key={p} value={p}>{p}</Option>)}
          </Select>
        </Form.Item>
        {selectedProgram && (
          <Form.Item name="academicYear" label="Academic Year"
            rules={[{ required: true, message: 'Please select your academic year' }]}>
            <Select size="large" placeholder="Select year" onChange={setSelectedYear}>
              {Object.keys(SUBJECTS[selectedProgram]).map(y => <Option key={y} value={parseInt(y)}>{parseInt(y) === 1 ? '1st Year' : parseInt(y) === 2 ? '2nd Year' : parseInt(y) === 3 ? '3rd Year' : '4th Year'}</Option>)}
            </Select>
          </Form.Item>
        )}
        {selectedYear && (
          <Form.Item name="subjects" label="Subjects (Optional - subjects will be read from uploaded file)"
            rules={[]}>
            <Select size="large" placeholder="Select subjects (optional)" mode="multiple" onChange={(selected) => {
              if (selected && selected.length > 0) {
                const semesters = new Set(selected.map(sub => subjectToSemester[sub]));
                if (semesters.size === 1) {
                  form.setFieldsValue({ semester: Array.from(semesters)[0] });
                }
              }
            }}>
              {(() => {
                const allSubjects = [];
                Object.values(SUBJECTS[selectedProgram][selectedYear]).forEach(semSubjects => {
                  allSubjects.push(...semSubjects);
                });
                return allSubjects.map(s => <Option key={s} value={s}>{s}</Option>);
              })()}
            </Select>
          </Form.Item>
        )}
        <Form.Item name="semester" label="Semester"
          rules={[{ required: true, message: 'Please select a semester' }]}>
          <Radio.Group className="semester-radio-group">
            <Radio.Button value={1}>Semester 1</Radio.Button>
            <Radio.Button value={2}>Semester 2</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="branch" label="Branch"
          rules={[{ required: true, message: 'Please select your branch' }]}>
          <Select size="large" placeholder="Select branch" suffixIcon={<BankOutlined />}>
            {BRANCHES.map(b => <Option key={b.value} value={b.value}>{b.label}</Option>)}
          </Select>
        </Form.Item>
      </Form>
      <div className="step-footer">
        <Button type="primary" size="large" icon={<ArrowRightOutlined />}
          iconPosition="end" onClick={handleNext} className="next-btn">
          Continue to Upload
        </Button>
      </div>
    </div>
  );
};

// ─── Step 2: File Upload ──────────────────────────────────────────────────────
const FileUploadZone = ({ file, setFile, onBack, onSubmit, uploading, uploadProgress, uploadStatus }) => {
  const onDrop = useCallback(
    (accepted) => { if (accepted.length > 0) setFile(accepted[0]); },
    [setFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div className="step-content">
      <div className="step-header">
        <CloudUploadOutlined className="step-icon" />
        <div>
          <Title level={4} style={{ margin: 0 }}>Upload Marks File</Title>
          <Text type="secondary">Drag &amp; drop a PDF, CSV, or Excel file containing student marks.</Text>
        </div>
      </div>
      <Divider />

      <div {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''} ${uploading ? 'uploading' : ''}`}>
        <input {...getInputProps()} />
        {file ? (
          <Space direction="vertical" align="center" size={8}>
            <FileIcon fileName={file.name} />
            <Text strong>{file.name}</Text>
            <Text type="secondary">{(file.size / 1024).toFixed(1)} KB</Text>
            {!uploading && (
              <Button danger size="small" onClick={e => { e.stopPropagation(); setFile(null); }}>
                Remove
              </Button>
            )}
          </Space>
        ) : (
          <Space direction="vertical" align="center" size={4}>
            <CloudUploadOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
            <Text strong style={{ fontSize: 15 }}>
              {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
            </Text>
            <Text type="secondary">or <span className="browse-text">browse to select</span></Text>
            <Space size={4} style={{ marginTop: 8 }}>
              <Tag icon={<FilePdfOutlined />} color="red">PDF</Tag>
              <Tag icon={<FileExcelOutlined />} color="green">CSV</Tag>
              <Tag icon={<FileExcelOutlined />} color="blue">XLSX</Tag>
              <Tag icon={<FileExcelOutlined />} color="cyan">XLS</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 11 }}>Maximum file size: 20 MB</Text>
          </Space>
        )}
      </div>

      {uploading && (
        <div className="upload-progress" style={{ marginTop: 16 }}>
          <Progress percent={uploadProgress} status="active" />
          <Text type="secondary" style={{ fontSize: 12 }}>{uploadStatus?.message}</Text>
        </div>
      )}

      {uploadStatus && !uploading && (
        <Alert type={uploadStatus.type} message={uploadStatus.message} showIcon style={{ marginTop: 12 }} />
      )}

      <Card size="small" style={{ marginTop: 16 }} title="CSV / Excel Format Guide">
        <Text strong style={{ fontSize: 12 }}>Required columns:</Text>
        <div style={{ marginTop: 6, marginBottom: 8 }}>
          {['studentNumber','name','subject','score','type'].map(col => (
            <Tag key={col} color="blue" style={{ marginBottom: 4 }}>{col}</Tag>
          ))}
        </div>
        <pre className="code-example">
{`studentNumber,name,subject,score,type
STU001,John Doe,Mathematics,85,quiz
STU002,Jane Smith,Physics,92,final`}
        </pre>
      </Card>

      <div className="step-footer" style={{ justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={uploading} size="large">
          Back
        </Button>
        <Button type="primary" icon={<CloudUploadOutlined />} onClick={onSubmit}
          disabled={!file || uploading} loading={uploading} className="next-btn" size="large">
          {uploading ? 'Uploading…' : 'Submit Upload'}
        </Button>
      </div>
    </div>
  );
};

// ─── Step 3: Success ──────────────────────────────────────────────────────────
const SuccessStep = ({ formValues, file, uploadResult, onReset }) => {
  // ✅ Backend now returns only the matched student's row(s) in preview,
  // plus a studentFound flag. We still normalize both sides as a safety net
  // in case an older backend version is running.
  const rawPreview   = uploadResult?.preview || [];
  const studentFound = uploadResult?.studentFound ?? (rawPreview.length > 0);
  const enteredId    = normalizeId(formValues?.studentId);

  // Filter: keep only rows where the Registration No matches the student.
  // normalizeId() handles spaced IDs from the file ("IT 23 1458 70" → "IT23145870").
  const preview = rawPreview.filter(row => {
    const regVal = normalizeId(
      row['Registration No'] || row['studentNumber'] || row['student_number'] ||
      row['StudentNumber']   || row['regNo']         || row['reg_no']         || ''
    );
    // If the backend already filtered to the student's row, enteredId === regVal.
    // If not (old backend), we do the filtering here.
    return !enteredId || regVal === enteredId || regVal === '';
  });

  const recordsCount = uploadResult?.recordsCount || 0;

  // Build table columns dynamically, skip __EMPTY keys
  const buildColumns = (rows) => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]).filter(k => !k.startsWith('__EMPTY') && k.trim());
    const priority = ['Registration No','CA Marks','Grade','Pass/Fail','Status',
                      'studentNumber','subject','score','grade','status'];
    const sorted = [
      ...priority.filter(k => keys.includes(k)),
      ...keys.filter(k => !priority.includes(k))
    ].slice(0, 6);

    return sorted.map(k => ({
      title: k, dataIndex: k, key: k, ellipsis: true,
      render: v => {
        const val = String(v ?? '').trim();
        if (['Pass/Fail','Status','status'].includes(k)) {
          if (val.toLowerCase() === 'pass') return <Tag color="success">Pass</Tag>;
          if (val.toLowerCase() === 'fail') return <Tag color="error">Fail</Tag>;
        }
        return val || '—';
      }
    }));
  };

  const columns = buildColumns(preview);

  return (
    <div className="step-content success-step">
      <div className="success-icon-wrapper">
        <CheckOutlined className="success-check" />
      </div>
      <Title level={3} style={{ marginTop: 16, color: '#52c41a' }}>Upload Successful!</Title>
      <Text type="secondary">Your marks file has been submitted for processing.</Text>

      {/* ── Summary stats ── */}
      <Row gutter={16} style={{ marginTop: 20, width: '100%', maxWidth: 480 }}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <TrophyOutlined style={{ fontSize: 22, color: '#52c41a' }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{recordsCount}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>Records Extracted</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#e6f4ff', borderColor: '#91caff' }}>
            <FileExcelOutlined style={{ fontSize: 22, color: '#1890ff' }} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{file?.name}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>File Uploaded</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff7e6', borderColor: '#ffd591' }}>
            <UserOutlined style={{ fontSize: 22, color: '#fa8c16' }} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{formValues?.studentId || '—'}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>Student ID</Text>
          </Card>
        </Col>
      </Row>

      {/* ── Student details ── */}
      <Descriptions bordered size="small" column={1}
        style={{ marginTop: 16, width: '100%', maxWidth: 480 }}>
        <Descriptions.Item label="Name">{formValues?.fullName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Student ID">{formValues?.studentId || '—'}</Descriptions.Item>
        <Descriptions.Item label="Academic Year">
          {ACADEMIC_YEARS.find(y => y.value === formValues?.academicYear)?.label || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Semester">
          {formValues?.semester ? `Semester ${formValues.semester}` : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Branch">
          {BRANCHES.find(b => b.value === formValues?.branch)?.label || '—'}
        </Descriptions.Item>
      </Descriptions>

      {/* ── Student's marks row ── */}
      {preview.length > 0 ? (
        <div style={{ marginTop: 16, width: '100%', maxWidth: 640 }}>
          <Text strong>Your Marks</Text>
          <Table
            dataSource={preview}
            columns={columns}
            rowKey={(_, i) => i}
            size="small"
            pagination={false}
            style={{ marginTop: 8 }}
            scroll={{ x: true }}
          />
        </div>
      ) : (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16, width: '100%', maxWidth: 480 }}
          message="No marks found for your Student ID"
          description={
            `No record was found for "${formValues?.studentId}" in the uploaded file. ` +
            `Please ensure your Student ID matches the Registration No in the file exactly.`
          }
        />
      )}

      <div className="step-footer" style={{ justifyContent: 'center', marginTop: 24, gap: 12 }}>
        <Button type="primary" icon={<UploadOutlined />} onClick={onReset} size="large">
          Upload Another File
        </Button>
        <Button type="default" icon={<BarChartOutlined />} onClick={() => window.location.href = '/analytics'} size="large">
          View Analytics
        </Button>
      </div>
    </div>
  );
};

// ─── History helpers ──────────────────────────────────────────────────────────
const getStatusTag = (status) => {
  const cfg = {
    completed:  { color: 'success',    icon: <CheckCircleOutlined />,  text: 'Completed' },
    processing: { color: 'processing', icon: <ClockCircleOutlined />,  text: 'Processing' },
    failed:     { color: 'error',      icon: <CloseCircleOutlined />,  text: 'Failed' },
    pending:    { color: 'warning',    icon: <ClockCircleOutlined />,  text: 'Pending' },
  };
  const { color, icon, text } = cfg[status] || cfg.pending;
  return <Tag color={color} icon={icon}>{text}</Tag>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const UploadPage = () => {
  const [form] = Form.useForm();
  const [currentStep,    setCurrentStep]    = useState(0);
  const [file,           setFile]           = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus,   setUploadStatus]   = useState(null);
  const [formValues,     setFormValues]     = useState(null);
  const [uploadResult,   setUploadResult]   = useState(null);
  const [allExtractions, setAllExtractions] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [stats,          setStats]          = useState({
    totalUploads: 0, successfulExtractions: 0, failedExtractions: 0, totalRecords: 0
  });
  const [selectedExtraction, setSelectedExtraction] = useState(null);
  const [modalVisible,       setModalVisible]       = useState(false);

  const [currentStudentId, setCurrentStudentId] = useState(
    () => sessionStorage.getItem('uploadStudentId') || ''
  );

  // Filter history to only the current student (normalize both sides)
  const extractions = currentStudentId
    ? allExtractions.filter(e => normalizeId(e.studentId) === normalizeId(currentStudentId))
    : allExtractions;

  useEffect(() => {
    loadExtractionHistory();
    loadStats();
  }, []);

  const loadExtractionHistory = async () => {
    setLoading(true);
    try {
      const data = await uploadService.getExtractionHistory();
      if (data?.data?.length > 0) setAllExtractions(data.data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await uploadService.getExtractionStats();
      if (data?.data) setStats(data.data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  // ── Submit upload ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const values = form.getFieldsValue(true);
    setFormValues({ ...values });

    // Normalize and persist student ID
    const normalizedStudentId = normalizeId(values.studentId);
    if (normalizedStudentId) {
      setCurrentStudentId(normalizedStudentId);
      sessionStorage.setItem('uploadStudentId', normalizedStudentId);
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ type: 'info', message: 'Uploading file…' });

    try {
      // ✅ FIX: Send studentId in FormData so backend can find and return
      // that student's specific row from anywhere in the file — not just
      // the first N rows. This is the key fix for large files (622+ records).
      const response = await uploadService.uploadFile(
        file,
        {
          studentId: normalizedStudentId,
          fullName: values.fullName,
          academicYear: values.academicYear,
          semester: values.semester,
          branch: values.branch,
          courseProgram: values.courseProgram,
          subjects: values.subjects
        },
        (p) => {
          setUploadProgress(p);
          setUploadStatus({ type: 'info', message: `Uploading… ${p}%` });
        }
      );

      // uploadService.uploadFile returns response.data (axios body):
      // { success: true, data: { recordsCount, preview, studentFound, ... }, message: ... }
      // So response is { success, data, message } structure
      const resultData = response?.data || {};

      console.log('[Upload] full response:', response);
      console.log('[Upload] resultData:', resultData);
      console.log('[Upload] preview array?', Array.isArray(resultData?.preview));
      console.log('[Upload] preview:', resultData?.preview);
      console.log('[Upload] studentFound:', resultData?.studentFound);

      setUploadResult(resultData);

      // 🔑 CRITICAL FIX: Store preview data in sessionStorage so AnalyticsPage can access it immediately
      // AnalyticsPage reads from sessionStorage first, before querying the API
      if (resultData?.preview && Array.isArray(resultData.preview)) {
        console.log('[Upload] preview is array with', resultData.preview.length, 'items');
        // Get subjects from form - these are the subjects the user selected during upload
        const selectedSubjects = Array.isArray(values.subjects) ? values.subjects : [];
        console.log('[Upload] selected subjects from form:', selectedSubjects);
        
        // Transform preview to match the score format that AnalyticsPage expects
        const analyticsScores = resultData.preview.map((row, idx) => {
          console.log('[Upload] processing row:', Object.keys(row));
          // Extract score with multiple fallback field names
          let score = null;
          const rawScore = row['CA Marks'] ?? row['ca_marks'] ?? row['CAMarks'] ?? row['Marks'] ?? row['marks'] ?? row['Score'] ?? row['score'] ?? row['Total'] ?? row['total'] ?? null;
          if (rawScore !== null) {
            score = parseFloat(String(rawScore).replace(/[^0-9.]/g, ''));
          }
          if (isNaN(score) || score === null) score = 0;
          
          // Use selected subjects - if we have multiple, use the first one, otherwise try to extract from row
          let subject = row['Subject'] || row['subject'] || row['Module Name'] || row['Module'] || row['course'] || row['Course'] || '';
          if (!subject && selectedSubjects.length > 0) {
            // If no subject in row, use the first selected subject (since file typically contains marks for one subject per upload)
            subject = selectedSubjects[0];
            console.log('[Upload] using selected subject:', subject);
          }
          
          return {
            subject: subject,
            score: score,
            grade: row['Grade'] || row['grade'] || '',
            status: row['Pass/Fail'] || row['Status'] || row['status'] || '',
            studentNumber: normalizedStudentId,
            name: values.fullName,
            branch: values.branch || '',
            date: new Date().toISOString(),
            // Preserve all original fields in case AnalyticsPage needs them
            ...row
          };
        });
        console.log('[Upload] storing analyticsScores in sessionStorage:', analyticsScores.length, 'rows');
        console.log('[Upload] sample scores:', analyticsScores.slice(0, 2));
        sessionStorage.setItem('analyticsScores', JSON.stringify(analyticsScores));
        console.log('[Upload] stored! sessionStorage.analyticsScores size:', sessionStorage.getItem('analyticsScores')?.length, 'bytes');
      } else {
        console.warn('[Upload] preview is NOT an array!', typeof resultData?.preview, resultData?.preview);
      }

      // Add to local history
      const newEntry = {
        id:               resultData.extractionId || 'local-' + Date.now(),
        fileName:         file.name,
        fileType:         file.name.match(/\.pdf$/i) ? 'pdf' : 'excel',
        status:           'completed',
        uploadedAt:       new Date().toISOString(),
        processedAt:      new Date().toISOString(),
        recordCount:      resultData.recordsCount || 0,
        studentId:        normalizedStudentId,
        validationErrors: []
      };
      setAllExtractions(prev => [newEntry, ...prev]);
      setStats(prev => ({
        totalUploads:          prev.totalUploads + 1,
        successfulExtractions: prev.successfulExtractions + 1,
        failedExtractions:     prev.failedExtractions,
        totalRecords:          prev.totalRecords + (resultData.recordsCount || 0),
      }));

      setUploadStatus({ type: 'success', message: 'Upload complete!' });
      setCurrentStep(2);

      setTimeout(() => { loadExtractionHistory(); loadStats(); }, 1000);

    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || 'Upload failed. Please try again.';
      setUploadStatus({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFile(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setFormValues(null);
    setUploadResult(null);
    setCurrentStep(0);
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'File Name', dataIndex: 'fileName', key: 'fileName',
      render: (text, record) => (
        <Space>
          {record.fileType === 'pdf'
            ? <FilePdfOutlined style={{ color: '#ff4d4f' }} />
            : <FileExcelOutlined style={{ color: '#52c41a' }} />}
          {text}
        </Space>
      ),
    },
    { title: 'Student ID',  dataIndex: 'studentId',   key: 'studentId' },
    { title: 'Upload Date', dataIndex: 'uploadedAt',  key: 'uploadedAt',
      render: d => d ? new Date(d).toLocaleString() : '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => getStatusTag(s) },
    { title: 'Records', dataIndex: 'recordCount', key: 'recordCount', render: c => c || 0 },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />}
              onClick={() => { setSelectedExtraction(record); setModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="Download"><Button type="text" icon={<DownloadOutlined />} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="upload-page">
      <Card className="upload-header" style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <CloudUploadOutlined style={{ fontSize: 28, color: '#1890ff' }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>Upload Marks</Title>
                <Text type="secondary">Submit your student marks via PDF, CSV, or Excel</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => { loadExtractionHistory(); loadStats(); }}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card className="wizard-card">
            <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}
              items={[
                { title: 'Student Info', icon: <UserOutlined /> },
                { title: 'Upload File',  icon: <CloudUploadOutlined /> },
                { title: 'Done',         icon: <CheckOutlined /> },
              ]}
            />
            {currentStep === 0 && <StudentInfoForm form={form} onNext={() => setCurrentStep(1)} />}
            {currentStep === 1 && (
              <FileUploadZone
                file={file} setFile={setFile}
                onBack={() => { setUploadStatus(null); setCurrentStep(0); }}
                onSubmit={handleSubmit}
                uploading={uploading} uploadProgress={uploadProgress} uploadStatus={uploadStatus}
              />
            )}
            {currentStep === 2 && (
              <SuccessStep
                formValues={formValues} file={file}
                uploadResult={uploadResult} onReset={handleReset}
              />
            )}
          </Card>

          <Row gutter={12} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card size="small">
                <Statistic title="Total Uploads" value={stats.totalUploads} prefix={<UploadOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Success Rate"
                  value={stats.totalUploads > 0
                    ? Math.round((stats.successfulExtractions / stats.totalUploads) * 100) : 0}
                  suffix="%" prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={<Space><HistoryOutlined />Upload History</Space>}
            extra={<Button type="link" icon={<BarChartOutlined />} onClick={() => window.location.href = '/analytics'}>View Analytics</Button>}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : (
              <Table
                dataSource={extractions} columns={columns} rowKey="id" size="small"
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No upload history yet" /> }}
              />
            )}
          </Card>

          <Card title="Recent Activity" style={{ marginTop: 16 }}>
            {extractions.length > 0 ? (
              <Timeline items={extractions.slice(0, 5).map(e => ({
                color: e.status === 'completed' ? 'green' : e.status === 'failed' ? 'red' : 'blue',
                children: (
                  <div>
                    <Text strong>{e.fileName} {e.status === 'completed' ? 'processed' : e.status}</Text>
                    <br />
                    <Text type="secondary">
                      {e.recordCount || 0} records · {new Date(e.uploadedAt).toLocaleString()}
                    </Text>
                  </div>
                )
              }))} />
            ) : (
              <Timeline items={[
                { color: 'green', children: <div><Text strong>grades_2024_q1.pdf processed</Text><br /><Text type="secondary">45 records extracted · 2 minutes ago</Text></div> },
                { color: 'green', children: <div><Text strong>student_scores_feb.csv processed</Text><br /><Text type="secondary">78 records extracted · 1 hour ago</Text></div> },
                { color: 'red',   children: <div><Text strong>midterm_results.pdf failed</Text><br /><Text type="secondary">Invalid file format · 3 hours ago</Text></div> },
              ]} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Extraction Details" open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>Close</Button>,
          <Button key="dl" type="primary" icon={<DownloadOutlined />}>Download Data</Button>,
        ]}
        width={700}
      >
        {selectedExtraction && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="File Name" span={2}>
                <Space>
                  {selectedExtraction.fileType === 'pdf'
                    ? <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                    : <FileExcelOutlined style={{ color: '#52c41a' }} />}
                  {selectedExtraction.fileName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(selectedExtraction.status)}</Descriptions.Item>
              <Descriptions.Item label="Records">{selectedExtraction.recordCount}</Descriptions.Item>
              <Descriptions.Item label="Uploaded At">{new Date(selectedExtraction.uploadedAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Processed At">
                {selectedExtraction.processedAt ? new Date(selectedExtraction.processedAt).toLocaleString() : '—'}
              </Descriptions.Item>
            </Descriptions>
            {selectedExtraction.validationErrors?.length > 0 && (
              <Alert type="warning" style={{ marginTop: 16 }} message="Validation Errors"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {selectedExtraction.validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                }
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UploadPage;