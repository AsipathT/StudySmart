import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSessionTheme } from '../context/SessionThemeContext';
import { Typography, Card, Button, List, Space, Tag, Modal, Drawer, message, Divider, Col, Row, Statistic, Table, Form, Input, Select, Upload, Tabs, Avatar, Popconfirm } from 'antd';
import { 
  CalculatorOutlined, 
  ExperimentOutlined, 
  BookOutlined, 
  HistoryOutlined, 
  GlobalOutlined, 
  LaptopOutlined, 
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  BulbOutlined,
  ReloadOutlined,
  SaveOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  SettingOutlined,
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
  CloseOutlined,
  TeamOutlined,
  AppstoreOutlined,
  InboxOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../hooks/useAuth';
import subjectService from '../services/subjectService';
import studySessionService from '../services/studySessionService';
import './StudySessionPage.css';

const { Title, Text } = Typography;

const SHAPES = [
  { key: 'circle',  label: '●', style: { borderRadius: '50%' } },
  { key: 'square',  label: '■', style: { borderRadius: '8px' } },
  { key: 'rounded', label: '▣', style: { borderRadius: '18px' } },
  { key: 'diamond', label: '◆', style: { borderRadius: '8px', transform: 'rotate(45deg)' } },
  { key: 'hexagon', label: '⬡', style: { borderRadius: '12px' } },
  { key: 'shield',  label: '🛡', style: { borderRadius: '50% 50% 40% 40%' } },
];

const GRADIENTS = [
  { key: 'indigo',  value: 'linear-gradient(135deg,#6366f1,#4f46e5)', label: 'Indigo' },
  { key: 'blue',    value: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', label: 'Blue' },
  { key: 'cyan',    value: 'linear-gradient(135deg,#06b6d4,#0284c7)', label: 'Cyan' },
  { key: 'emerald', value: 'linear-gradient(135deg,#10b981,#059669)', label: 'Emerald' },
  { key: 'rose',    value: 'linear-gradient(135deg,#f43f5e,#e11d48)', label: 'Rose' },
  { key: 'violet',  value: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', label: 'Violet' },
  { key: 'sunset',  value: 'linear-gradient(135deg,#f97316,#db2777)', label: 'Sunset' },
  { key: 'teal',    value: 'linear-gradient(135deg,#14b8a6,#0f766e)', label: 'Teal' },
];

// Maps plain hex colors (seeded subjects) → gradients. Anything already a gradient passes through.
const HEX_TO_GRADIENT = {
  '#3b82f6': 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  '#ef4444': 'linear-gradient(135deg,#ef4444,#b91c1c)',
  '#10b981': 'linear-gradient(135deg,#10b981,#059669)',
  '#f59e0b': 'linear-gradient(135deg,#f97316,#ea580c)', // yellow → orange
  '#8b5cf6': 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  '#06b6d4': 'linear-gradient(135deg,#06b6d4,#0284c7)',
  '#374151': 'linear-gradient(135deg,#475569,#1e293b)',
  '#ec4899': 'linear-gradient(135deg,#ec4899,#db2777)',
  '#14b8a6': 'linear-gradient(135deg,#14b8a6,#0f766e)',
  '#f97316': 'linear-gradient(135deg,#f97316,#db2777)',
};

const getSubjectGradient = (color) => {
  if (!color) return 'linear-gradient(135deg,#1d4ed8,#1e40af)';
  if (color.includes('gradient')) return color;
  return HEX_TO_GRADIENT[color.toLowerCase()] || 'linear-gradient(135deg,#6366f1,#4f46e5)';
};

const MaterialRow = ({ mat, subjectId, editingPagesMat, setEditingPagesMat, onSave }) => {
  const isEditing = editingPagesMat?.matId === mat._id;
  const { isDark } = useSessionTheme();
  const fileHref = subjectId && mat._id
    ? `http://localhost:5000/api/subjects/${subjectId}/materials/${mat._id}/file`
    : `http://localhost:5000${mat.fileUrl}`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: 10, marginBottom: 6,
    }}>
      {/* PDF name link */}
      <FilePdfOutlined style={{ color: '#f87171', fontSize: 16, flexShrink: 0 }} />
      <a
        href={fileHref}
        target="_blank" rel="noreferrer"
        style={{ color: isDark ? '#e2e8f0' : '#334155', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}
      >
        {mat.name}
      </a>

      {/* Page count / edit */}
      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <input
            type="number"
            min={0}
            autoFocus
            value={editingPagesMat.value}
            onChange={e => setEditingPagesMat({ matId: mat._id, value: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') onSave(mat._id, editingPagesMat.value);
              if (e.key === 'Escape') setEditingPagesMat(null);
            }}
            style={{
              width: 60, height: 28, borderRadius: 7, textAlign: 'center',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: '1px solid rgba(99,102,241,0.5)',
              color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 13, fontWeight: 700, outline: 'none',
            }}
          />
          <button
            onClick={() => onSave(mat._id, editingPagesMat.value)}
            style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Save"
          >✓</button>
          <button
            onClick={() => setEditingPagesMat(null)}
            style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Cancel"
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => setEditingPagesMat({ matId: mat._id, value: mat.totalPages || 0 })}
          title="Edit page count"
          style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            padding: '3px 10px', borderRadius: 20,
            background: mat.totalPages ? 'rgba(99,102,241,0.12)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${mat.totalPages ? 'rgba(99,102,241,0.3)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: mat.totalPages ? '#818cf8' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.35)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {mat.totalPages ? `${mat.totalPages} pg` : '+ pages'}
          <EditOutlined style={{ fontSize: 9 }} />
        </button>
      )}
    </div>
  );
};

const StudySessionPage = () => {
  const { user } = useAuth();
  const { isDark } = useSessionTheme();
  const [stage, setStage] = useState('subjects'); // 'subjects', 'units', 'unit-details', 'session', 'summary'
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitHistory, setUnitHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [newSubjectModalVisible, setNewSubjectModalVisible] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetUnitId, setTargetUnitId] = useState(null);
  const [materialBeingStudied, setMaterialBeingStudied] = useState('');
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingMaterial, setPendingMaterial] = useState('');
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [sessionPagesData, setSessionPagesData] = useState(null); // { completed, total, materialName }

  // Session Timer States
  const [sessionStatus, setSessionStatus] = useState('inactive'); // 'inactive', 'active', 'paused'
  const [upTime, setUpTime] = useState(0);
  const [workedTime, setWorkedTime] = useState(0);
  
  // Pomodoro Timer States
  const [pomodoroStatus, setPomodoroStatus] = useState('inactive'); // 'inactive', 'active'
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [initialPomodoroTime, setInitialPomodoroTime] = useState(0);
  const [intervalsCompleted, setIntervalsCompleted] = useState(0);

  const pomodoroIntervalRef = useRef(null);
  const pomodoroFiredRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const [moduleForm] = Form.useForm();
  const [unitForm] = Form.useForm();
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeManageTab, setActiveManageTab] = useState('edit');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editingPagesMat, setEditingPagesMat] = useState(null); // { matId, value }
  const [editGradient, setEditGradient] = useState('linear-gradient(135deg,#6366f1,#4f46e5)');
  const [editShape, setEditShape] = useState('circle');
  const [editForm] = Form.useForm();
  const editNameWatch = Form.useWatch('name', editForm);
  const [selectedShape, setSelectedShape] = useState('circle');
  const [selectedGradient, setSelectedGradient] = useState('linear-gradient(135deg,#6366f1,#4f46e5)');
  const moduleNameWatch = Form.useWatch('name', moduleForm);
  const moduleDifficultyWatch = Form.useWatch('difficulty', moduleForm);

  useEffect(() => {
    fetchSubjects();
    return () => {
      clearInterval(pomodoroIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (sessionStatus === 'active') {
      const id = setInterval(() => {
        setUpTime((prev) => prev + 1);
        if (pomodoroStatus === 'active') {
          setWorkedTime((prev) => prev + 1);
        }
      }, 1000);
      return () => clearInterval(id);
    }
  }, [sessionStatus, pomodoroStatus]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const resp = await subjectService.getAllSubjects();
      setSubjects(resp.data);
      setCurrentPage(1);
    } catch (error) {
      message.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/auth/users');
      setUsersList(data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const openAdminModal = async (subjectToManage) => {
    fetchUsers();
    const subj = subjectToManage || selectedSubject;
    let freshSubj = subj;
    if (subj?._id) {
      try {
        const resp = await subjectService.getSubjectById(subj._id);
        freshSubj = resp.data;
        setSelectedSubject(resp.data);
      } catch (e) {
        setSelectedSubject(subj);
      }
    }
    setSelectedStudentIds([]);
    setStudentSearch('');
    setActiveManageTab('edit');
    setEditGradient(getSubjectGradient(freshSubj?.color));
    setEditShape(freshSubj?.icon || 'circle');
    editForm.setFieldsValue({ name: freshSubj?.name || '' });
    setAdminModalVisible(true);
  };

  const fetchUnitHistory = async (unitName, params = {}) => {
    try {
      let resp;
      if (user.role === 'admin') {
        resp = await studySessionService.getAllHistory(params);
      } else {
        resp = await studySessionService.getHistory(user.id || user._id, params);
      }
      const filtered = resp.data.filter(s => s.unitName === unitName);
      setUnitHistory(filtered);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const handleSubjectSelect = async (subject) => {
    try {
      const resp = await subjectService.getSubjectById(subject._id);
      setSelectedSubject(resp.data);
      setStage('units');
    } catch (e) {
      message.error('Failed to load subject details');
    }
  };

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit);
    setStage('unit-details');
  };

  const startSessionWithMaterial = (materialName) => {
    if (user?.role === 'admin') return;
    setPendingMaterial(materialName);
    setShowStartModal(true);
  };

  const confirmStartSession = () => {
    setShowStartModal(false);
    setMaterialBeingStudied(pendingMaterial);
    fetchUnitHistory(selectedUnit.name);
    setStage('session');
    setUpTime(0);
    setWorkedTime(0);
    setSessionStatus('active');
  };

  // Session Controls
  const startSession = () => {
    setSessionStatus('active');
  };

  const pauseSession = () => {
    setSessionStatus('paused');
    if (pomodoroStatus === 'active') {
      clearInterval(pomodoroIntervalRef.current);
      setPomodoroStatus('inactive');
    }
  };

  const stopSession = () => {
    setSessionStatus('inactive');
    clearInterval(pomodoroIntervalRef.current);
    setPomodoroStatus('inactive');
    // Find total pages of the material being studied
    const mat = selectedUnit?.materials?.find(m => m.name === materialBeingStudied);
    setPagesCompleted(0);
    setSessionPagesData(null);
    setStopModalVisible(true);
    // store mat for use in modal
    stopSessionMatRef.current = mat || null;
  };

  const stopSessionMatRef = useRef(null);

  const handleStopConfirm = () => {
    const mat = stopSessionMatRef.current;
    const total = mat?.totalPages || 0;
    setSessionPagesData({
      completed: pagesCompleted,
      total,
      materialName: materialBeingStudied,
    });
    setStopModalVisible(false);
    setStage('summary');
  };

  // Pomodoro Controls
  const setIntervalTime = (minutes) => {
    const seconds = minutes * 60;
    setPomodoroTime(seconds);
    setInitialPomodoroTime(seconds);
    message.info(`Pomodoro set to ${minutes} minutes`);
  };

  const startPomodoro = () => {
    if (pomodoroTime === 0) {
      message.warning('Please set a duration first');
      return;
    }
    if (sessionStatus !== 'active') {
        startSession();
    }
    setPomodoroStatus('active');
    pomodoroFiredRef.current = false;
    pomodoroIntervalRef.current = setInterval(() => {
      setPomodoroTime((prev) => {
        if (prev <= 1) {
          if (!pomodoroFiredRef.current) {
            pomodoroFiredRef.current = true;
            clearInterval(pomodoroIntervalRef.current);
            setPomodoroStatus('inactive');
            setIntervalsCompleted((prevCount) => prevCount + 1);
            message.success('Interval completed!');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSaveSummary = async () => {
    try {
      await studySessionService.saveSession({
        userId: user.id || user._id,
        subject: selectedSubject.name,
        unitName: selectedUnit.name,
        materialName: materialBeingStudied,
        workedTime: workedTime,
        notes: `Studied material: ${materialBeingStudied} within ${selectedUnit.name}.`,
        startTime: new Date(Date.now() - upTime * 1000),
        endTime: new Date(),
        duration: upTime, 
        intervals: intervalsCompleted,
        pomodoroMode: true
      });
      message.success('Session summary saved successfully!');
      fetchUnitHistory(selectedUnit.name);
    } catch (error) {
      message.error('Failed to save session summary');
    }
  };

  const generatePDF = (sessionData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 116, 240);
    doc.text('StudySmart Session Summary', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    
    // Session Info
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(14);
    doc.setTextColor(33);
    doc.text(`Subject: ${sessionData.subject}`, 20, 45);
    doc.text(`Module: ${sessionData.unitName || 'N/A'}`, 20, 55);
    doc.text(`Study Material: ${sessionData.materialName || 'Full Module'}`, 20, 65);
    
    // Table
    const tableData = [
      ['Session Duration', formatTime(sessionData.duration)],
      ['Intervals Completed', `${sessionData.intervals || 0} Pomodoros`],
      ['Start Time', new Date(sessionData.startTime).toLocaleString()],
      ['End Time', new Date(sessionData.endTime || Date.now()).toLocaleString()],
      ['Specific Material', sessionData.materialName || 'None Selected']
    ];
    
    autoTable(doc, {
      startY: 75,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [40, 116, 240] }
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Keep studying and stay smart!', 105, doc.lastAutoTable.finalY + 20, { align: 'center' });
    
    doc.save(`Session_Summary_${new Date().getTime()}.pdf`);
  };

  const reset = () => {
    setStage('subjects');
    setSelectedSubject(null);
    setSelectedUnit(null);
    setUpTime(0);
    setWorkedTime(0);
    setPomodoroTime(0);
    setIntervalsCompleted(0);
    setSessionStatus('inactive');
    setPomodoroStatus('inactive');
    setSessionPagesData(null);
    setPagesCompleted(0);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectIcon = (iconName) => {
    const shapeLabels = { circle: '●', square: '■', rounded: '▣', diamond: '◆', hexagon: '⬡', shield: '🛡' };
    if (shapeLabels[iconName]) return <span style={{ fontSize: 14, lineHeight: 1 }}>{shapeLabels[iconName]}</span>;
    switch (iconName) {
      case 'math': case 'Calculator': return <CalculatorOutlined />;
      case 'science': case 'Atom': return <ExperimentOutlined />;
      case 'history': case 'History': return <HistoryOutlined />;
      case 'language': case 'Globe': return <GlobalOutlined />;
      case 'Laptop': return <LaptopOutlined />;
      case 'BookOpen': return <BookOutlined />;
      default: return <BookOutlined />;
    }
  };

  const getShapeStyle = (iconKey) => {
    const shape = SHAPES.find(s => s.key === iconKey);
    return shape?.style || { borderRadius: '10px' };
  };

  const handleCreateSubject = async (values) => {
    try {
      await subjectService.createSubject({
        ...values,
        icon: selectedShape,
        color: selectedGradient,
        units: [],
      });
      message.success('Module created successfully');
      setNewSubjectModalVisible(false);
      moduleForm.resetFields();
      setSelectedShape('circle');
      setSelectedGradient('linear-gradient(135deg,#6366f1,#4f46e5)');
      fetchSubjects();
    } catch (e) {
    const errMsg = e?.response?.data?.message || 'Failed to create module';
    message.error(errMsg);
  }
  };

  const handleCreateModule = async (values) => {
    try {
      await subjectService.createModule(selectedSubject._id, values);
      message.success('Unit added successfully');
      unitForm.resetFields();
      const resp = await subjectService.getSubjectById(selectedSubject._id);
      setSelectedSubject(resp.data);
      fetchSubjects();
    } catch (e) { message.error('Failed to add unit'); }
  };

  const handleAddStudents = async () => {
    if (selectedStudentIds.length === 0) { message.warning('Select at least one student'); return; }
    try {
      for (const studentId of selectedStudentIds) {
        await subjectService.addStudent(selectedSubject._id, studentId);
      }
      message.success(`${selectedStudentIds.length} student(s) assigned`);
      setSelectedStudentIds([]);
      const resp = await subjectService.getSubjectById(selectedSubject._id);
      setSelectedSubject(resp.data);
    } catch (e) { message.error('Failed to assign students'); }
  };

  const handleDeleteSubject = async () => {
    try {
      await subjectService.deleteSubject(selectedSubject._id);
      message.success(`"${selectedSubject.name}" deleted`);
      setAdminModalVisible(false);
      fetchSubjects();
    } catch (e) {
      message.error('Failed to delete subject');
    }
  };

  const handleEditSubject = async (values) => {
    try {
      await subjectService.updateSubject(selectedSubject._id, {
        name: values.name,
        color: editGradient,
        icon: editShape,
      });
      message.success('Subject updated');
      const resp = await subjectService.getSubjectById(selectedSubject._id);
      setSelectedSubject(resp.data);
      fetchSubjects();
    } catch (e) {
      const errMsg = e?.response?.data?.message || 'Failed to update subject';
      message.error(errMsg);
    }
  };

  const handleSaveMaterialPages = async (matId, totalPages) => {
    try {
      await subjectService.updateMaterialPages(selectedSubject._id, matId, totalPages);
      message.success('Page count updated');
      setEditingPagesMat(null);
      const resp = await subjectService.getSubjectById(selectedSubject._id);
      setSelectedSubject(resp.data);
    } catch (e) {
      message.error('Failed to update page count');
    }
  };

  const handleUploadMaterial = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', selectedFile.name);
    if (targetUnitId) formData.append('unitId', targetUnitId);
    try {
      await subjectService.uploadMaterial(selectedSubject._id, formData);
      message.success('Material uploaded');
      setSelectedFile(null);
      setTargetUnitId(null);
      const resp = await subjectService.getSubjectById(selectedSubject._id);
      setSelectedSubject(resp.data);
      fetchSubjects();
    } catch (e) { message.error('Upload failed'); }
  };

  const historyColumns = [
    { title: 'Date', dataIndex: 'endTime', key: 'date', render: d => new Date(d).toLocaleDateString() },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', render: d => formatTime(d) },
    { title: 'Intervals', dataIndex: 'intervals', key: 'intervals' },
    { title: 'Material', dataIndex: 'materialName', key: 'materialName' }
  ];

  // Text colours that flip between dark / light mode
  const tc = {
    primary:   isDark ? '#f1f5f9'               : '#1e293b',
    body:      isDark ? '#e2e8f0'               : '#334155',
    secondary: isDark ? 'rgba(255,255,255,0.55)': 'rgba(15,23,42,0.6)',
    muted:     isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.4)',
    dim:       isDark ? 'rgba(255,255,255,0.18)': 'rgba(15,23,42,0.25)',
    white:     isDark ? '#fff'                  : '#1e293b',
  };

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    border:     isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: 12,
    color: tc.primary,
    fontSize: 14,
  };

  const labelStyle = {
    color: tc.secondary,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
  };

  return (
    <div className={`session-tracker-container${isDark ? '' : ' light-mode'}`}>
      <div className="bg-visuals" aria-hidden="true">
        {/* Static glow blobs */}
        <div className="sess-glow sess-glow-1" />
        <div className="sess-glow sess-glow-2" />
        <div className="sess-glow sess-glow-3" />
        <div className="sess-glow sess-glow-4" />
        {/* Dot grid */}
        <div className="sess-dots" />
        {/* Geometric shapes */}
        <div className="sess-shape sess-shape-1" />
        <div className="sess-shape sess-shape-2" />
        <div className="sess-shape sess-shape-3" />
        <div className="sess-shape sess-shape-4" />
        <div className="sess-shape sess-shape-5" />
        {/* Diagonal lines */}
        <div className="sess-line sess-line-1" />
        <div className="sess-line sess-line-2" />
        <div className="sess-line sess-line-3" />
        {/* Static math / study symbols */}
        <span className="sess-sym sy1">π</span>
        <span className="sess-sym sy2">∑</span>
        <span className="sess-sym sy3">∞</span>
        <span className="sess-sym sy4">∫</span>
        <span className="sess-sym sy5">Δ</span>
        <span className="sess-sym sy6">⬡</span>
        <span className="sess-sym sy7">◈</span>
        <span className="sess-sym sy8">∂</span>
        <span className="sess-sym sy9">λ</span>
        <span className="sess-sym sy10">θ</span>
        <span className="sess-sym sy11">∇</span>
        <span className="sess-sym sy12">⚛</span>
        <span className="sess-sym sy13">📚</span>
        <span className="sess-sym sy14">🎓</span>
        <span className="sess-sym sy15">🔬</span>
        <span className="sess-sym sy16">📐</span>
      </div>
      {stage === 'subjects' && (
        <div className="subjects-view">
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <Title level={2}>Session Tracker</Title>
              <Text type="secondary">Select a subject to start your study session</Text>
            </div>
            {user?.role === 'admin' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNewSubjectModalVisible(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  borderRadius: '100px',
                  height: '40px',
                  padding: '0 22px',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Create Module
              </Button>
            )}
          </div>
          <div className="subject-grid">
            {subjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((subj) => (
               <Card
                 key={subj._id}
                 className="subject-card"
                 hoverable
                 onClick={() => handleSubjectSelect(subj)}
                 style={{ '--tile-gradient': getSubjectGradient(subj.color) }}
               >
                 {/* Background decorations */}
                 <div className="card-deco-circle" />
                 <div className="card-deco-circle-sm" />
                 <div className="card-deco-dots" />

                 {/* Top section */}
                 <div>
                   <div className="subject-icon" style={getShapeStyle(subj.icon)}>
                     {getSubjectIcon(subj.icon)}
                   </div>
                   <Title level={4}>{subj.name}</Title>
                   <div className="subject-card-meta">
                     <span>{subj.units.length} {subj.units.length === 1 ? 'Unit' : 'Units'}</span>
                     {user?.role === 'admin' && (
                       <>
                         <span className="subject-card-meta-dot" />
                         <span>{subj.students?.length || 0} Students</span>
                       </>
                     )}
                   </div>
                 </div>

                 {/* Bottom section */}
                 <div>
                   {user?.role === 'admin' ? (
                     <div
                       className="tile-manage-btn"
                       onClick={(e) => { e.stopPropagation(); openAdminModal(subj); }}
                     >
                       <SettingOutlined style={{ fontSize: 12, opacity: 0.8 }} />
                       <span>Manage Subject</span>
                       <ArrowRightOutlined className="tile-manage-btn-arrow" />
                     </div>
                   ) : (
                     <div className="tile-units-pill">
                       <span className="tile-units-pill-dot" />
                       <span>{subj.units.length} {subj.units.length === 1 ? 'Unit' : 'Units'}</span>
                     </div>
                   )}
                 </div>
              </Card>
            ))}
          </div>

          {subjects.length > PAGE_SIZE && (
            <div className="subjects-pagination">
              <Button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                ← Prev
              </Button>
              <span style={{ color: tc.secondary, fontSize: 13, fontWeight: 600 }}>
                Page {currentPage} of {Math.ceil(subjects.length / PAGE_SIZE)}
              </span>
              <Button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(subjects.length / PAGE_SIZE)}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      )}

      {stage === 'units' && (
        <div className="units-view">

          {/* ── Top nav ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button
              onClick={() => setStage('subjects')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: 10, color: tc.secondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> All Subjects
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => openAdminModal(selectedSubject)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, color: '#818cf8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                <SettingOutlined style={{ fontSize: 12 }} /> Manage Subject
              </button>
            )}
          </div>

          {/* ── Subject hero banner ── */}
          <div style={{
            background: getSubjectGradient(selectedSubject?.color),
            borderRadius: 20, padding: '24px 28px', marginBottom: 24,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -36, right: -36, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 60, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                {getSubjectIcon(selectedSubject?.icon)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', marginBottom: 4 }}>{selectedSubject?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 100, fontWeight: 600 }}>
                    {selectedSubject?.units?.length || 0} Units
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 100, fontWeight: 600 }}>
                    {(selectedSubject?.materials?.length || 0) + (selectedSubject?.units?.reduce((s, u) => s + (u.materials?.length || 0), 0) || 0)} PDFs
                  </span>
                  {user?.role === 'admin' && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 100, fontWeight: 600 }}>
                      {selectedSubject?.students?.length || 0} Students
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Main layout ── */}
          <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr 300px' : '1fr', gap: 20, alignItems: 'start' }}>

            {/* Units list */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                {selectedSubject?.units?.length || 0} Units / Modules
              </div>
              {(selectedSubject?.units?.length || 0) === 0 ? (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '40px 24px', textAlign: 'center' }}>
                  <BookOutlined style={{ fontSize: 36, color: tc.dim, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, color: tc.dim }}>No units added yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedSubject.units.map((unit, idx) => (
                    <div
                      key={unit._id}
                      className="unit-row-card"
                      onClick={() => handleUnitSelect(unit)}
                    >
                      {/* Index badge */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: getSubjectGradient(selectedSubject?.color), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 900, color: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,0.3)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: tc.primary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {unit.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {unit.durationMinutes > 0 && (
                            <span style={{ fontSize: 11, color: tc.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockCircleOutlined style={{ fontSize: 10 }} />{unit.durationMinutes} min
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: tc.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FilePdfOutlined style={{ fontSize: 10, color: '#f87171' }} />{unit.materials?.length || 0} PDF{unit.materials?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Badges + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {(unit.materials?.length || 0) > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', padding: '3px 9px', borderRadius: 8 }}>
                            {unit.materials.length} material{unit.materials.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowRightOutlined style={{ fontSize: 11, color: tc.muted }} className="unit-row-arrow" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin right column */}
            {user?.role === 'admin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Global materials */}
                <div style={{ background: isDark ? 'rgba(15,23,41,0.7)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FilePdfOutlined style={{ color: '#f87171', fontSize: 13 }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject Materials</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: tc.muted, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 100 }}>
                      {selectedSubject?.materials?.length || 0}
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    {(selectedSubject?.materials?.length || 0) === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: tc.dim }}>No global materials</div>
                    ) : (
                      selectedSubject.materials.map((mat, i) => (
                        <a key={i} href={`http://localhost:5000/api/subjects/${selectedSubject._id}/materials/${mat._id}/file`} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: i < selectedSubject.materials.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textDecoration: 'none' }}>
                          <FilePdfOutlined style={{ color: '#f87171', fontSize: 13, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.name}</span>
                        </a>
                      ))
                    )}
                  </div>
                </div>

                {/* Students */}
                <div style={{ background: isDark ? 'rgba(15,23,41,0.7)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined style={{ color: '#60a5fa', fontSize: 13 }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Students</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: tc.muted, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 100 }}>
                      {selectedSubject?.students?.length || 0}
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    {(selectedSubject?.students?.length || 0) === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: tc.dim }}>No students assigned yet</div>
                    ) : (
                      selectedSubject.students.map((st, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: i < selectedSubject.students.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <UserOutlined style={{ fontSize: 12, color: '#60a5fa' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: tc.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</div>
                            <div style={{ fontSize: 11, color: tc.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.email}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {stage === 'unit-details' && (
        <div className="unit-details-view">

          {/* ── Top nav / breadcrumb ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setStage('units')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: 10, color: tc.secondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> {selectedSubject?.name}
            </button>
            <span style={{ fontSize: 12, color: tc.dim }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: tc.secondary }}>{selectedUnit?.name}</span>
          </div>

          {/* ── Unit hero banner ── */}
          <div style={{
            background: getSubjectGradient(selectedSubject?.color),
            borderRadius: 18, padding: '22px 26px', marginBottom: 22,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -16, right: 50, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOutlined style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>{selectedSubject?.name}</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px' }}>{selectedUnit?.name}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Materials</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{selectedUnit?.materials?.length || 0}</div>
              </div>
            </div>
            {selectedUnit?.durationMinutes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 11, borderTop: '1px solid rgba(255,255,255,0.15)', position: 'relative', zIndex: 1 }}>
                <ClockCircleOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Planned Duration: {selectedUnit.durationMinutes} minutes</span>
              </div>
            )}
          </div>

          {/* ── Materials list ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            Learning Materials
          </div>

          {(selectedUnit?.materials?.length || 0) === 0 ? (
            <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
              <FilePdfOutlined style={{ fontSize: 40, color: tc.dim, marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: tc.dim, marginBottom: 5 }}>No materials uploaded yet</div>
              <div style={{ fontSize: 12, color: tc.dim }}>
                {user?.role === 'admin' ? 'Upload PDFs via Manage Subject.' : 'Ask your admin to upload study materials.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedUnit.materials.map((mat, idx) => (
                <div key={mat._id || idx} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isDark ? 'rgba(15,23,41,0.7)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 14, padding: '16px 20px',
                  transition: 'border-color 0.2s, background 0.2s',
                }}>
                  {/* PDF icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FilePdfOutlined style={{ fontSize: 18, color: '#f87171' }} />
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={`http://localhost:5000/api/subjects/${selectedSubject?._id}/materials/${mat._id}/file`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 14, fontWeight: 700, color: tc.primary, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}
                    >
                      {mat.name}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: tc.muted }}>PDF Document</span>
                      {mat.totalPages > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '1px 8px', borderRadius: 100 }}>
                          {mat.totalPages} pages
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student: Start Session button */}
                  {user?.role !== 'admin' && (
                    <button
                      onClick={() => startSessionWithMaterial(mat.name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                        padding: '10px 18px', borderRadius: 11,
                        background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        transition: 'opacity 0.18s, transform 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = ''}
                    >
                      <PlayCircleOutlined style={{ fontSize: 13 }} /> Start Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === 'session' && (
        <div className="active-session-view">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <button
              onClick={() => setStage('unit-details')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 10, color: tc.secondary, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> Exit Session
            </button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: tc.primary }}>{selectedUnit.name}</div>
              <div style={{ fontSize: 12, color: tc.muted }}>{selectedSubject.name} · Study Session</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 24 }}>

            {/* ── Card 1: Session Time ── */}
            <div className="clock-card clock-card-session" style={{
              background: 'rgba(37,99,235,0.07)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* accent bar */}
              <div style={{ height: 3, background: 'linear-gradient(90deg,#3b82f6,#6366f1,#06b6d4)' }} />
              <div style={{ padding: '24px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                {/* Label + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: tc.muted, letterSpacing: '1.4px', textTransform: 'uppercase' }}>Session Time</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 100,
                    background: sessionStatus === 'active' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                    border: `1px solid ${sessionStatus === 'active' ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
                    fontSize: 10, fontWeight: 700,
                    color: sessionStatus === 'active' ? '#4ade80' : '#fbbf24',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: sessionStatus === 'active' ? '#4ade80' : '#fbbf24',
                      boxShadow: sessionStatus === 'active' ? '0 0 6px #4ade80' : '0 0 6px #fbbf24',
                    }} />
                    {sessionStatus === 'active' ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>

                {/* Subject name */}
                <div style={{ fontSize: 13, color: tc.secondary, fontWeight: 600, marginBottom: 4 }}>{selectedSubject.name}</div>

                {/* Timer digits */}
                <div className="timer-up" style={{ margin: '8px 0 16px' }}>{formatTime(upTime)}</div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <button
                    onClick={sessionStatus === 'paused' ? startSession : pauseSession}
                    style={{
                      flex: 1, height: 40, borderRadius: 12, border: '1px solid rgba(59,130,246,0.35)',
                      background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    {sessionStatus === 'paused' ? <><PlayCircleOutlined />Resume</> : <><PauseCircleOutlined />Pause</>}
                  </button>
                  <button
                    onClick={stopSession}
                    style={{
                      flex: 1, height: 40, borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)',
                      background: 'rgba(239,68,68,0.12)', color: '#f87171',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    <StopOutlined />Stop
                  </button>
                </div>
              </div>
            </div>

            {/* ── Card 2: Worked Time ── */}
            <div className="clock-card clock-card-worked" style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(52,211,153,0.18)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg,#10b981,#34d399,#6ee7b7)' }} />
              <div style={{ padding: '24px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: tc.muted, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 4 }}>Worked Time</div>
                <div style={{ fontSize: 13, color: tc.muted, fontWeight: 500 }}>Tracked during Pomodoro only</div>
                <div className="timer-up" style={{
                  margin: '8px 0',
                  background: 'linear-gradient(to bottom,#4ade80,#166534)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>{formatTime(workedTime)}</div>

                {/* Progress bar: worked / total */}
                <div style={{ width: '100%', marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: tc.muted, fontWeight: 600 }}>
                    <span>Efficiency</span>
                    <span>{upTime > 0 ? Math.round((workedTime / upTime) * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${upTime > 0 ? Math.min((workedTime / upTime) * 100, 100) : 0}%`,
                      background: 'linear-gradient(90deg,#10b981,#34d399)',
                      borderRadius: 100,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>

                {/* Intervals summary */}
                <div style={{
                  marginTop: 14, padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(52,211,153,0.15)',
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                }}>
                  <CheckCircleOutlined style={{ color: '#34d399', fontSize: 16 }} />
                  <span style={{ color: tc.secondary, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: '#4ade80', fontWeight: 800 }}>{intervalsCompleted}</span> Pomodoro{intervalsCompleted !== 1 ? 's' : ''} completed
                  </span>
                </div>
              </div>
            </div>

            {/* ── Card 3: Pomodoro ── */}
            <div className="clock-card clock-card-pomo" style={{
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(251,113,133,0.18)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(244,63,94,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg,#f43f5e,#fb7185,#fda4af)' }} />
              <div style={{ padding: '24px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: tc.muted, letterSpacing: '1.4px', textTransform: 'uppercase' }}>Pomodoro</span>
                  {pomodoroStatus === 'active' && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 100,
                      background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.3)',
                      fontSize: 10, fontWeight: 700, color: '#fb7185',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fb7185', boxShadow: '0 0 6px #fb7185' }} />
                      RUNNING
                    </span>
                  )}
                </div>

                <div className="timer-down" style={{ margin: '4px 0 10px' }}>{formatTime(pomodoroTime)}</div>

                {/* Duration picker */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
                  {[2, 5, 10, 25, 50].map(m => (
                    <button
                      key={m}
                      onClick={() => setIntervalTime(m)}
                      disabled={pomodoroStatus === 'active'}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: `1px solid ${initialPomodoroTime === m * 60 ? 'rgba(251,113,133,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        background: initialPomodoroTime === m * 60 ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.04)',
                        color: initialPomodoroTime === m * 60 ? '#fb7185' : tc.muted,
                        transition: 'all 0.2s',
                        opacity: pomodoroStatus === 'active' ? 0.4 : 1,
                      }}
                    >{m}m</button>
                  ))}
                </div>

                {/* Start / Reset */}
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <button
                    onClick={startPomodoro}
                    disabled={pomodoroStatus === 'active' || pomodoroTime === 0}
                    style={{
                      flex: 1, height: 40, borderRadius: 12,
                      border: 'none',
                      background: pomodoroStatus === 'active' || pomodoroTime === 0
                        ? 'rgba(255,255,255,0.05)'
                        : 'linear-gradient(135deg,#f43f5e,#e11d48)',
                      color: pomodoroStatus === 'active' || pomodoroTime === 0 ? 'rgba(255,255,255,0.25)' : '#fff',
                      fontWeight: 700, fontSize: 13, cursor: pomodoroStatus === 'active' || pomodoroTime === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: pomodoroStatus === 'active' || pomodoroTime === 0 ? 'none' : '0 4px 16px rgba(244,63,94,0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <PlayCircleOutlined />Start
                  </button>
                  <button
                    onClick={() => setPomodoroTime(initialPomodoroTime)}
                    disabled={pomodoroStatus === 'active'}
                    style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: pomodoroStatus === 'active' ? tc.dim : tc.secondary,
                      cursor: pomodoroStatus === 'active' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, transition: 'all 0.2s',
                    }}
                  >
                    <ReloadOutlined />
                  </button>
                </div>
              </div>
            </div>

          </div>

          <Card style={{ marginTop: 24 }} title="Reference Materials" extra={<FilePdfOutlined />}>
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={selectedUnit.materials || []}
              renderItem={(mat) => (
                <List.Item>
                  <Card size="small" hoverable>
                    <a href={`http://localhost:5000/api/subjects/${selectedSubject?._id}/materials/${mat._id}/file`} target="_blank" rel="noreferrer">
                      <Space>
                        <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                        {mat.name}
                      </Space>
                    </a>
                  </Card>
                </List.Item>
              )}
              locale={{ emptyText: 'No specific materials for this module' }}
            />
          </Card>

        </div>
      )}

      {stage === 'summary' && (() => {
        const focusRate   = upTime > 0 ? Math.round((workedTime / upTime) * 100) : 0;
        const breakTime   = upTime - workedTime;
        const sessionEndTime   = new Date();
        const sessionStartTime = new Date(Date.now() - upTime * 1000);
        const pomoDurationMin  = initialPomodoroTime > 0 ? Math.round(initialPomodoroTime / 60) : 0;
        const readPct = sessionPagesData && sessionPagesData.total > 0
          ? Math.round((sessionPagesData.completed / sessionPagesData.total) * 100)
          : null;
        const motivationalMsg = focusRate >= 80
          ? "Outstanding focus!"
          : focusRate >= 60
            ? "Great session!"
            : focusRate >= 30
              ? "Good effort — keep it up!"
              : "Every session counts!";

        return (
          <div className="summary-view" style={{ padding: '4px 0 32px' }}>

            {/* ── Hero Banner ── */}
            <div style={{
              background: getSubjectGradient(selectedSubject?.color),
              borderRadius: 20, padding: '26px 28px', marginBottom: 16,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -24, right: 70, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircleOutlined style={{ fontSize: 26, color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Session Complete!</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedSubject?.name} · {selectedUnit?.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Total Time</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1.15 }}>{formatTime(upTime)}</div>
                </div>
              </div>

              {/* Time range row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 13, borderTop: '1px solid rgba(255,255,255,0.15)', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                <ClockCircleOutlined style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>→</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {sessionEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  {sessionStartTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#fff', fontWeight: 700, background: 'rgba(255,255,255,0.18)', padding: '3px 12px', borderRadius: 100 }}>
                  {motivationalMsg}
                </span>
              </div>
            </div>

            {/* ── 4 stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {/* Total Session */}
              <div className="timer-card-total" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ClockCircleOutlined style={{ color: '#60a5fa', fontSize: 13 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Total Session</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>{formatTime(upTime)}</div>
                <div style={{ fontSize: 11, color: tc.dim, marginTop: 3 }}>Wall-clock time</div>
              </div>

              {/* Focus Time */}
              <div className="timer-card-focus" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ThunderboltOutlined style={{ color: '#34d399', fontSize: 13 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Focus Time</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>{formatTime(workedTime)}</div>
                <div style={{ fontSize: 11, color: tc.dim, marginTop: 3 }}>Active pomodoro time</div>
              </div>

              {/* Break / Idle */}
              <div className="timer-card-break" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PauseCircleOutlined style={{ color: '#fbbf24', fontSize: 13 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Break / Idle</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>{formatTime(breakTime)}</div>
                <div style={{ fontSize: 11, color: tc.dim, marginTop: 3 }}>Non-focus time</div>
              </div>

              {/* Focus Rate */}
              <div className="timer-card-rate" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrophyOutlined style={{ color: '#818cf8', fontSize: 13 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Focus Rate</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>{focusRate}%</div>
                <div style={{ fontSize: 11, color: tc.dim, marginTop: 3 }}>
                  {focusRate >= 70 ? 'Excellent' : focusRate >= 40 ? 'Good' : focusRate > 0 ? 'Can improve' : 'No pomodoro used'}
                </div>
              </div>
            </div>

            {/* ── Middle: Pomodoro + Reading Progress ── */}
            <div style={{ display: 'grid', gridTemplateColumns: sessionPagesData?.total > 0 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>

              {/* Pomodoro card */}
              <div className="timer-card-pomo" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🍅</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pomodoro Summary</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Intervals Done',  value: intervalsCompleted,                                                                       sub: 'completed rounds',  color: '#fb7185' },
                    { label: 'Duration Each',   value: pomoDurationMin > 0 ? `${pomoDurationMin}m` : '—',                                        sub: 'per interval',      color: '#f43f5e' },
                    { label: 'Total Focused',   value: workedTime > 0 ? `${Math.round(workedTime / 60)}m` : '—',                                 sub: 'focused minutes',   color: '#fb7185' },
                    { label: 'Avg / Interval',  value: intervalsCompleted > 0 && workedTime > 0 ? `${Math.round(workedTime / intervalsCompleted / 60)}m` : '—', sub: 'avg per round', color: '#f43f5e' },
                  ].map(s => (
                    <div key={s.label} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '11px 13px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: tc.muted, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 19, fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: tc.dim, marginTop: 1 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {upTime > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tc.muted, marginBottom: 4 }}>
                      <span>Focus efficiency</span><span style={{ fontWeight: 700 }}>{focusRate}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${focusRate}%`, borderRadius: 100, background: 'linear-gradient(90deg,#f43f5e,#fb7185)', boxShadow: '0 0 8px rgba(244,63,94,0.45)' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Reading Progress */}
              {sessionPagesData?.total > 0 && (() => {
                const pct = readPct;
                const pagesLeft = sessionPagesData.total - sessionPagesData.completed;
                const ringC = 2 * Math.PI * 32;
                return (
                  <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 16, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <FilePdfOutlined style={{ color: '#818cf8', fontSize: 15 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reading Progress</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
                      {/* SVG ring */}
                      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                        <svg viewBox="0 0 80 80" width="80" height="80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                          <circle cx="40" cy="40" r="32" fill="none"
                            stroke={pct === 100 ? '#34d399' : '#818cf8'} strokeWidth="7" strokeLinecap="round"
                            strokeDasharray={ringC} strokeDashoffset={ringC * (1 - pct / 100)}
                            transform="rotate(-90 40 40)"
                            style={{ filter: `drop-shadow(0 0 5px ${pct === 100 ? '#34d399' : '#818cf8'})`, transition: 'stroke-dashoffset 1s ease' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: pct === 100 ? '#34d399' : '#818cf8', lineHeight: 1 }}>{pct}%</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: tc.body, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sessionPagesData.materialName}
                        </div>
                        {[
                          { l: 'Pages read',  v: `${sessionPagesData.completed} / ${sessionPagesData.total}`, c: '#818cf8' },
                          { l: 'Remaining',   v: `${pagesLeft} pages`,                                         c: tc.secondary },
                        ].map(r => (
                          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: tc.muted }}>{r.l}</span>
                            <span style={{ fontWeight: 700, color: r.c }}>{r.v}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 8, height: 5, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: pct === 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6366f1,#818cf8,#06b6d4)', boxShadow: '0 0 8px rgba(99,102,241,0.45)' }} />
                        </div>
                      </div>
                    </div>
                    {pct === 100 && (
                      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 10, padding: '8px 0' }}>
                        🎉 Material fully completed!
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Session Details ── */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Session Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {[
                  { label: 'Subject',          value: selectedSubject?.name },
                  { label: 'Unit / Module',    value: selectedUnit?.name },
                  { label: 'Material Studied', value: materialBeingStudied || 'General session' },
                  { label: 'Started At',       value: sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) },
                  { label: 'Ended At',         value: sessionEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) },
                  { label: 'Date',             value: sessionStartTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) },
                ].map(d => (
                  <div key={d.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: tc.muted, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>{d.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tc.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveSummary}
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: 12, fontWeight: 700, height: 46, paddingInline: 24 }}>
                Save to History
              </Button>
              <Button size="large" icon={<DownloadOutlined />}
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: tc.body, borderRadius: 12, fontWeight: 600, height: 46, paddingInline: 20 }}
                onClick={() => generatePDF({
                  subject: selectedSubject.name,
                  unitName: selectedUnit.name,
                  materialName: materialBeingStudied,
                  duration: upTime,
                  intervals: intervalsCompleted,
                  startTime: new Date(Date.now() - upTime * 1000),
                  endTime: new Date(),
                })}>
                Download PDF
              </Button>
              <Button size="large" onClick={reset}
                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)', color: tc.secondary, borderRadius: 12, fontWeight: 600, height: 46, paddingInline: 20 }}>
                Finish
              </Button>
            </div>

          </div>
        );
      })()}

      <Drawer
        open={newSubjectModalVisible}
        onClose={() => { setNewSubjectModalVisible(false); moduleForm.resetFields(); }}
        placement="right"
        width={420}
        closable={false}
        rootClassName="adm-new-subj-drawer"
        styles={{
          body: { padding: 0, background: '#0b1222', display: 'flex', flexDirection: 'column', height: '100%' },
          wrapper: { boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' },
        }}
      >
        {/* ── Live preview header ── */}
        <div style={{
          padding: '32px 28px 24px',
          background: selectedGradient,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 56, height: 56,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff',
              flexShrink: 0,
              ...SHAPES.find(s => s.key === selectedShape)?.style,
            }}>
              {SHAPES.find(s => s.key === selectedShape)?.label}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                {moduleNameWatch?.trim() || 'New Module'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                Module Preview
              </div>
            </div>
          </div>
        </div>

        {/* ── Form body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 0' }}>
          <Form form={moduleForm} onFinish={handleCreateSubject} layout="vertical" requiredMark={false}>

            <Form.Item name="name" label={<span style={labelStyle}>Module Name</span>} rules={[{ required: true, message: 'Enter module name' }]}>
              <Input placeholder="e.g. Advanced Physics" style={inputStyle} />
            </Form.Item>

            <Form.Item name="description" label={<span style={labelStyle}>Description</span>}>
              <Input.TextArea placeholder="What will students learn in this module?" rows={3}
                style={{ ...inputStyle, height: 'auto', resize: 'none' }} />
            </Form.Item>

            <Form.Item name="difficulty" label={<span style={labelStyle}>Difficulty Level</span>} initialValue="medium">
              <div style={{ display: 'flex', gap: 10 }}>
                {['Easy', 'Medium', 'Hard'].map(d => {
                  const colorMap = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
                  const val = d.toLowerCase();
                  const isSelected = (moduleDifficultyWatch || 'medium') === val;
                  return (
                    <div
                      key={d}
                      onClick={() => moduleForm.setFieldValue('difficulty', val)}
                      style={{
                        flex: 1, textAlign: 'center', padding: '10px 0',
                        borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        border: `1.5px solid ${isSelected ? colorMap[d] : 'rgba(255,255,255,0.08)'}`,
                        background: isSelected ? `${colorMap[d]}22` : 'rgba(255,255,255,0.03)',
                        color: isSelected ? colorMap[d] : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </Form.Item>

            <Form.Item name="estimatedHours" label={<span style={labelStyle}>Estimated Hours</span>}>
              <Input type="number" min={1} placeholder="e.g. 20" style={inputStyle} />
            </Form.Item>

            {/* Shape selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={labelStyle}>Icon Shape</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {SHAPES.map(shape => (
                  <div
                    key={shape.key}
                    onClick={() => setSelectedShape(shape.key)}
                    style={{
                      width: 48, height: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, cursor: 'pointer',
                      border: `2px solid ${selectedShape === shape.key ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                      background: selectedShape === shape.key ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                      transition: 'all 0.2s',
                      boxShadow: selectedShape === shape.key ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                      ...shape.style,
                    }}
                  >
                    {shape.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient picker */}
            <div style={{ marginBottom: 28 }}>
              <div style={labelStyle}>Theme Gradient</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {GRADIENTS.map(g => (
                  <div
                    key={g.key}
                    onClick={() => setSelectedGradient(g.value)}
                    title={g.label}
                    style={{
                      width: 36, height: 36,
                      borderRadius: 10,
                      background: g.value,
                      cursor: 'pointer',
                      border: `2px solid ${selectedGradient === g.value ? '#fff' : 'transparent'}`,
                      boxShadow: selectedGradient === g.value ? '0 0 0 3px rgba(255,255,255,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s',
                      transform: selectedGradient === g.value ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <Form.Item style={{ margin: 0 }}>
              <Button
                type="primary" htmlType="submit" block
                style={{
                  height: 50, borderRadius: 14,
                  background: selectedGradient, border: 'none',
                  fontWeight: 700, fontSize: 15,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                Create Module
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div style={{ height: 28 }} />
      </Drawer>

      {/* ── Manage Subject Drawer ── */}
      <Drawer
        open={adminModalVisible}
        onClose={() => setAdminModalVisible(false)}
        placement="right"
        width={460}
        closable={false}
        rootClassName="admin-manage-drawer"
        styles={{
          body: { padding: 0, background: '#0b1222', position: 'relative' },
          wrapper: { boxShadow: '-12px 0 50px rgba(0,0,0,0.6)' },
        }}
      >
        <div className="adm-inner" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b1222' }}>

        {/* Header — live preview updates with edit tab selections */}
        <div style={{
          padding: '26px 24px 20px',
          background: editGradient,
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0, ...(SHAPES.find(s => s.key === editShape)?.style || { borderRadius: '10px' }) }}>
              {getSubjectIcon(editShape)}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {editNameWatch?.trim() || selectedSubject?.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                {selectedSubject?.units?.length || 0} Units · {selectedSubject?.students?.length || 0} Students
              </div>
            </div>
            <button
              onClick={() => setAdminModalVisible(false)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Custom tab bar */}
        <div className="adm-tabbar" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {[
            { key: 'edit',      label: 'Edit',      icon: <EditOutlined /> },
            { key: 'units',     label: 'Units',     icon: <AppstoreOutlined /> },
            { key: 'students',  label: 'Students',  icon: <TeamOutlined /> },
            { key: 'materials', label: 'Materials', icon: <InboxOutlined /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveManageTab(tab.key)}
              data-active={activeManageTab === tab.key}
              style={{
                flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
                color: activeManageTab === tab.key ? '#818cf8' : 'rgba(255,255,255,0.4)',
                borderBottom: `2px solid ${activeManageTab === tab.key ? '#818cf8' : 'transparent'}`,
                cursor: 'pointer', fontSize: 12, fontWeight: activeManageTab === tab.key ? 700 : 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable tab content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {/* ── Edit Tab ── */}
          {activeManageTab === 'edit' && (
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>EDIT SUBJECT</div>
              <Form form={editForm} onFinish={handleEditSubject} layout="vertical" requiredMark={false}>
                <Form.Item
                  name="name"
                  label={<span style={labelStyle}>Subject Name</span>}
                  rules={[
                    { required: true, message: 'Enter subject name' },
                    { min: 2, message: 'Name must be at least 2 characters' },
                  ]}
                >
                  <Input placeholder="e.g. Advanced Physics" style={inputStyle} />
                </Form.Item>

                {/* Shape selector */}
                <div style={{ marginBottom: 24 }}>
                  <div style={labelStyle}>Icon Shape</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    {SHAPES.map(shape => (
                      <div
                        key={shape.key}
                        onClick={() => setEditShape(shape.key)}
                        style={{
                          width: 48, height: 48,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, cursor: 'pointer',
                          border: `2px solid ${editShape === shape.key ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                          background: editShape === shape.key ? 'rgba(129,140,248,0.18)' : 'rgba(255,255,255,0.04)',
                          transition: 'all 0.2s',
                          boxShadow: editShape === shape.key ? '0 0 0 3px rgba(129,140,248,0.2)' : 'none',
                          ...shape.style,
                        }}
                      >
                        {shape.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gradient picker */}
                <div style={{ marginBottom: 28 }}>
                  <div style={labelStyle}>Theme Gradient</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    {GRADIENTS.map(g => (
                      <div
                        key={g.key}
                        onClick={() => setEditGradient(g.value)}
                        title={g.label}
                        style={{
                          width: 36, height: 36, borderRadius: 10, background: g.value, cursor: 'pointer',
                          border: `2px solid ${editGradient === g.value ? '#fff' : 'transparent'}`,
                          boxShadow: editGradient === g.value ? '0 0 0 3px rgba(255,255,255,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s',
                          transform: editGradient === g.value ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <Form.Item style={{ margin: 0 }}>
                  <Button
                    type="primary" htmlType="submit" block
                    style={{ height: 46, borderRadius: 12, background: editGradient, border: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}

          {/* ── Units Tab ── */}
          {activeManageTab === 'units' && (
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>ADD UNIT</div>
              <Form form={unitForm} onFinish={handleCreateModule} layout="vertical" requiredMark={false}>
                <Form.Item name="name" rules={[{ required: true, message: 'Enter unit name' }, { min: 2, message: 'At least 2 characters' }]} style={{ marginBottom: 12 }}>
                  <Input placeholder="Unit name (e.g. Algebra Basics)" style={inputStyle} />
                </Form.Item>
                <Form.Item name="durationMinutes" initialValue={60} style={{ marginBottom: 16 }}>
                  <Input type="number" placeholder="Duration in minutes" style={inputStyle} />
                </Form.Item>
                <Button type="primary" htmlType="submit" block style={{ height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', fontWeight: 700 }}>
                  Add Unit
                </Button>
              </Form>
              {(selectedSubject?.units?.length || 0) > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12 }}>
                    EXISTING UNITS ({selectedSubject.units.length})
                  </div>
                  {selectedSubject.units.map((unit, i) => (
                    <div key={unit._id || i} className="adm-list-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{unit.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{unit.durationMinutes} min</div>
                      </div>
                      <ClockCircleOutlined style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Students Tab ── */}
          {activeManageTab === 'students' && (
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>ASSIGN STUDENTS</div>

              {/* Search box */}
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                style={{
                  width: '100%', padding: '9px 14px', marginBottom: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#f1f5f9', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Inline checklist */}
              {(() => {
                const available = usersList.filter(u =>
                  !selectedSubject?.students?.some(s => (s._id || s) === u.id)
                );
                const filtered = available.filter(u =>
                  !studentSearch.trim() ||
                  u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  u.email.toLowerCase().includes(studentSearch.toLowerCase())
                );
                if (filtered.length === 0) return (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '18px 0' }}>
                    {available.length === 0 ? 'All students already assigned' : 'No students match your search'}
                  </div>
                );
                return (
                  <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filtered.map(u => {
                      const isSelected = selectedStudentIds.includes(u.id);
                      const toggle = () => setSelectedStudentIds(prev =>
                        isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                      );
                      return (
                        <div
                          key={u.id}
                          onClick={toggle}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                            background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                            border: isSelected ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: isSelected ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 13, color: '#fff',
                          }}>
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ color: isSelected ? '#a5b4fc' : '#e2e8f0', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                          </div>
                          {/* Checkmark */}
                          <div style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)',
                            border: isSelected ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}>
                            {isSelected && (
                              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <Button
                type="primary" block
                disabled={selectedStudentIds.length === 0}
                onClick={handleAddStudents}
                style={{ height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', fontWeight: 700 }}
              >
                {selectedStudentIds.length > 0 ? `Add ${selectedStudentIds.length} Student${selectedStudentIds.length > 1 ? 's' : ''}` : 'Add Students'}
              </Button>
              {(selectedSubject?.students?.length || 0) > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12 }}>
                    ASSIGNED ({selectedSubject.students.length})
                  </div>
                  {selectedSubject.students.map((student, i) => {
                    const name = student.name || 'Student';
                    const email = student.email || '';
                    return (
                      <div key={student._id || i} className="adm-list-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>
                          {name[0].toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Materials Tab ── */}
          {activeManageTab === 'materials' && (
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>UPLOAD MATERIAL</div>
              <Select
                style={{ width: '100%', marginBottom: 12 }}
                placeholder="Assign to unit (or subject-wide)"
                onChange={v => setTargetUnitId(v)}
                defaultValue={null}
              >
                <Select.Option value={null}>Subject-wide</Select.Option>
                {selectedSubject?.units?.map(unit => (
                  <Select.Option key={unit._id} value={unit._id}>{unit.name}</Select.Option>
                ))}
              </Select>
              <Upload beforeUpload={file => { setSelectedFile(file); return false; }} maxCount={1} accept=".pdf" style={{ width: '100%' }}>
                <Button icon={<UploadOutlined />} block style={{ ...inputStyle, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedFile ? selectedFile.name : 'Select PDF File'}
                </Button>
              </Upload>
              <Button
                type="primary" block
                disabled={!selectedFile}
                onClick={handleUploadMaterial}
                style={{ marginTop: 12, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', fontWeight: 700 }}
              >
                Upload Material
              </Button>
              {(selectedSubject?.units?.length || 0) > 0 && (
                <div style={{ marginTop: 28 }}>
                  {selectedSubject.units.map((unit, i) => (
                    (unit.materials?.length || 0) > 0 && (
                      <div key={unit._id || i} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>
                          {unit.name}
                        </div>
                        {unit.materials.map((mat) => (
                          <MaterialRow
                            key={mat._id}
                            mat={mat}
                            subjectId={selectedSubject?._id}
                            editingPagesMat={editingPagesMat}
                            setEditingPagesMat={setEditingPagesMat}
                            onSave={handleSaveMaterialPages}
                          />
                        ))}
                      </div>
                    )
                  ))}
                  {(selectedSubject?.materials?.length || 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>SUBJECT-WIDE</div>
                      {selectedSubject.materials.map((mat) => (
                        <MaterialRow
                          key={mat._id}
                          mat={mat}
                          subjectId={selectedSubject?._id}
                          editingPagesMat={editingPagesMat}
                          setEditingPagesMat={setEditingPagesMat}
                          onSave={handleSaveMaterialPages}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned delete footer — always visible */}
        <div className="adm-footer" style={{ flexShrink: 0, padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0b1222' }}>
          <Button
            block
            icon={<DeleteOutlined />}
            onClick={() => setDeleteConfirmVisible(true)}
            style={{ borderRadius: 10, height: 40, fontWeight: 600, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            Delete Subject
          </Button>
        </div>

        </div>{/* end absolute wrapper */}
      </Drawer>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={deleteConfirmVisible}
        onCancel={() => setDeleteConfirmVisible(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{
          content: {
            background: '#0f1729',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 20,
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.1)',
          },
          mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' },
        }}
      >
        {/* Red accent top bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#ef4444,#dc2626,#b91c1c)' }} />

        <div style={{ padding: '32px 28px 28px' }}>
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(239,68,68,0.2) 0%,rgba(239,68,68,0.05) 70%)',
              border: '1.5px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DeleteOutlined style={{ fontSize: 26, color: '#f87171' }} />
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
              Delete Subject?
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              You're about to permanently delete{' '}
              <span style={{ color: '#f87171', fontWeight: 700 }}>"{selectedSubject?.name}"</span>.
              <br />All units and materials will be removed.
            </div>
          </div>

          {/* Warning note */}
          <div style={{
            margin: '20px 0',
            padding: '12px 16px',
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              This action <strong style={{ color: '#fca5a5' }}>cannot be undone</strong>. The subject and all its data will be permanently erased.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              block
              onClick={() => setDeleteConfirmVisible(false)}
              style={{
                height: 44, borderRadius: 12, fontWeight: 600, fontSize: 14,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Cancel
            </Button>
            <Button
              block
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={async () => { setDeleteConfirmVisible(false); await handleDeleteSubject(); }}
              style={{
                height: 44, borderRadius: 12, fontWeight: 700, fontSize: 14,
                background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                border: 'none',
                boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
              }}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Start Session Confirmation Modal ── */}
      <Modal
        open={showStartModal}
        onCancel={() => setShowStartModal(false)}
        footer={null}
        width={500}
        centered
        styles={{
          content: { background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 0, overflow: 'hidden' },
          mask: { backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.6)' },
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#6366f1,#818cf8,#06b6d4)', borderRadius: '20px 20px 0 0' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Icon + heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
            }}>
              <PlayCircleOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.4px' }}>Ready to Start?</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {pendingMaterial && <><FilePdfOutlined style={{ marginRight: 4 }} />{pendingMaterial}</>}
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '16px 0 24px', padding: '12px 16px', background: 'rgba(99,102,241,0.07)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
            You are about to start a <span style={{ color: '#818cf8', fontWeight: 700 }}>tracked study session</span>. From this point, all your study activity will be automatically recorded — your time, focus, and progress will be tracked until you stop the session.
          </p>

          {/* 3 Timer cards */}
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            3 Timers Active in This Session
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {[
              {
                icon: <ClockCircleOutlined />,
                color: '#60a5fa',
                bg: 'rgba(59,130,246,0.1)',
                border: 'rgba(59,130,246,0.2)',
                name: 'Total Session Timer',
                desc: 'Runs from the moment you start until you stop — counts every second, including breaks.',
              },
              {
                icon: <ThunderboltOutlined />,
                color: '#4ade80',
                bg: 'rgba(74,222,128,0.08)',
                border: 'rgba(74,222,128,0.18)',
                name: 'Focus Timer',
                desc: 'Only counts while you are actively studying. Pauses automatically when you take a break.',
              },
              {
                icon: <ReloadOutlined />,
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.08)',
                border: 'rgba(245,158,11,0.18)',
                name: 'Pomodoro Timer',
                desc: 'An optional countdown you set for each study interval (e.g. 25 min). Helps you stay focused in bursts.',
              },
            ].map(t => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: t.bg, border: `1px solid ${t.border}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: `${t.color}22`, border: `1px solid ${t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: t.color,
                }}>
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowStartModal(false)}
              style={{
                flex: 1, height: 42, borderRadius: 11, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
                transition: 'background 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              Cancel
            </button>
            <button
              onClick={confirmStartSession}
              style={{
                flex: 2, height: 42, borderRadius: 11, cursor: 'pointer',
                border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                transition: 'opacity 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}
            >
              <PlayCircleOutlined style={{ fontSize: 15 }} /> Start Tracking
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Stop Session / Pages Modal ── */}
      {stopModalVisible && (() => {
        const mat = stopSessionMatRef.current;
        const totalPages = mat?.totalPages || 0;
        const pct = totalPages > 0 ? Math.round((pagesCompleted / totalPages) * 100) : 0;
        return (
          <Modal
            open={stopModalVisible}
            onCancel={() => setStopModalVisible(false)}
            footer={null}
            closable={false}
            centered
            width={440}
            styles={{
              content: {
                background: '#0f1729',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 20,
                padding: 0,
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              },
              mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' },
            }}
          >
            {/* Top accent */}
            <div style={{ height: 4, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }} />

            <div style={{ padding: '28px 28px 24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))',
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>📖</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>How far did you get?</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {mat ? mat.name : materialBeingStudied}
                  </div>
                </div>
              </div>

              {totalPages > 0 ? (
                <>
                  {/* Pages info row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                  }}>
                    <span>Pages completed</span>
                    <span style={{ color: '#a5b4fc' }}>Total: {totalPages} pages</span>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={0}
                    max={totalPages}
                    value={pagesCompleted}
                    onChange={e => setPagesCompleted(Number(e.target.value))}
                    style={{ width: '100%', marginBottom: 12, accentColor: '#6366f1' }}
                  />

                  {/* Number input + percentage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <input
                      type="number"
                      min={0}
                      max={totalPages}
                      value={pagesCompleted}
                      onChange={e => setPagesCompleted(Math.min(totalPages, Math.max(0, Number(e.target.value))))}
                      style={{
                        width: 80, height: 42, borderRadius: 10, textAlign: 'center',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#f1f5f9', fontSize: 18, fontWeight: 800, outline: 'none',
                      }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>of {totalPages} pages</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 22, fontWeight: 800,
                      background: 'linear-gradient(135deg,#818cf8,#06b6d4)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ height: 10, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pct === 100
                          ? 'linear-gradient(90deg,#10b981,#34d399)'
                          : 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)',
                        borderRadius: 100,
                        transition: 'width 0.3s ease',
                        boxShadow: pct > 0 ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
                      }} />
                    </div>
                    {pct === 100 && (
                      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#4ade80', fontWeight: 700 }}>
                        🎉 Material fully completed!
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* No page data available */
                <div style={{
                  padding: '16px 18px', borderRadius: 12, marginBottom: 20,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center',
                }}>
                  No page count available for this material.<br />
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Progress tracking requires a PDF uploaded by your admin.</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  block
                  onClick={() => setStopModalVisible(false)}
                  style={{
                    height: 44, borderRadius: 12, fontWeight: 600, fontSize: 14,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  block
                  type="primary"
                  onClick={handleStopConfirm}
                  style={{
                    height: 44, borderRadius: 12, fontWeight: 700, fontSize: 14,
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                  }}
                >
                  Finish Session
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

    </div>
  );
};

export default StudySessionPage;
