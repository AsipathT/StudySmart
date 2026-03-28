import React, { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Select, Table, Tag, Space,
  Typography, Progress, Empty, Spin, Alert, Tooltip, Button,
  Modal, Descriptions, Avatar, List, Divider, Radio, Badge,
  Tabs, Timeline
} from 'antd';
import {
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  UserOutlined, BookOutlined, TrophyOutlined, WarningOutlined,
  DownloadOutlined, FilterOutlined, ReloadOutlined, EyeOutlined,
  SortAscendingOutlined, ExportOutlined, TeamOutlined,
  GlobalOutlined, RiseOutlined, FallOutlined, MinusOutlined,
  BulbOutlined, CloudUploadOutlined, CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import analyticsService from '../services/analytics.service';
import profileService from '../services/profile.service';
import { useAuth } from '../hooks/useAuth';
import './AnalyticsPage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// ── Brand palette (matches your app) ─────────────────────────────────────────
const PALETTE = {
  primary:    '#2563eb',
  primaryBg:  '#eff6ff',
  primaryLt:  '#dbeafe',
  success:    '#059669',
  successBg:  '#ecfdf5',
  warning:    '#d97706',
  warningBg:  '#fffbeb',
  error:      '#dc2626',
  errorBg:    '#fef2f2',
  purple:     '#7c3aed',
  purpleBg:   '#f5f3ff',
  text:       '#1e293b',
  textMd:     '#475569',
  textSm:     '#64748b',
  border:     '#dbeafe',
  bg:         '#f0f5ff',
};

const CHART_COLORS = [
  '#2563eb','#059669','#d97706','#dc2626','#7c3aed',
  '#0891b2','#db2777','#65a30d','#ea580c','#6366f1'
];

// Grade → colour mapping
const gradeColor = g => {
  if (!g) return PALETTE.textSm;
  const u = String(g).toUpperCase();
  if (u.startsWith('A')) return PALETTE.success;
  if (u.startsWith('B')) return PALETTE.primary;
  if (u.startsWith('C')) return PALETTE.warning;
  if (u.startsWith('D')) return '#f59e0b';
  return PALETTE.error;
};

const scoreColor = s =>
  s >= 75 ? PALETTE.success : s >= 55 ? PALETTE.warning : PALETTE.error;

// ── Subject list from UploadPage (kept in sync) ───────────────────────────────
const SUBJECTS = {
  "B.Sc (Hons) Information Technology": {
    1: {
      1: ["IT1180 - Effective Academic Communication","IT1140 - Fundamentals of Computing","IT1130 - Mathematics for Computing","IT1120 - Introduction to Programming","IE1030 - Data Communication Networks"],
      2: ["SE1020 - Object Oriented Programming","IT1170 - Data Structures and Algorithms","IT1160 - Discrete Mathematics","IT1150 - Technical Writing"]
    },
    2: {
      1: ["SE2030 - Software Engineering","IT2140 - Database Design and Development","IT2120 - Probability and Statistics","IT2011 - Artficial Intelligence and Machine Learning"],
      2: ["SE2020 - Web and Mobile Technology","IT2160 - Professional Skills","IT2150 - IT Project","IT2130 - Operating Systems and System Administration"]
    },
    3: {
      1: ["IT3050 - Employability Skills Development - Seminar","IT3040 - IT Project Management","IT3030 - Programming Applications and Frameworks","IT3020 - Database Systems","IT3010 - Network Design and Management"],
      2: ["IT3090 - Bussiness Management for IT","IT3080 - Data Science & Analytics","IT3070 - Information Assurance & Security","IT3060 - Human Computer Interaction"]
    },
    4: {
      1: ["Research Project (Comprehensive Design and Analysis Project ) - IT4010","IT4140 - Industry Placement - 6 Months","IT4130 - Image Understanding & Processing","IT4110 - Computer Systems and Network Administration","IT4100 - Software Quality Assurance","IT4070 - Preparation for the Professional World","IT4060 - Machine Learning","IT4020 - Modern Topics in IT","IE4040 - Information Assurance and Auditing"],
      2: ["IT4140 - Industry Placement - 6 Months","IT4130 - Image Understanding & Processing","IT4110 - Computer Systems and Network Administration","IT4100 - Software Quality Assurance","IT4070 - Preparation for the Professional World","IT4060 - Machine Learning","IT4020 - Modern Topics in IT","IT4010 - Research Project","IE4040 - Information Assurance and Auditing"]
    }
  },
  "B.Sc (Hons) Software Engineering": {
    3: {
      1: ["SE3040 - Application Frameworks","SE3030 - Software Architecture","SE3020 - Distributed Systems","SE3010 - Software Engineering Process & Quality Management","IT3050 - Employability Skills Development - Seminar"],
      2: ["SE3080 - Software Project Management","SE3070 - Case Studies in Software Engineering","SE3060 - Database Systems","SE3050 - User Experience Engineering"]
    },
    4: {
      1: ["Research Project (Comprehensive Design and Analysis Project )","SE4020 - Mobile Application Design and Development","SE4010 - Current Trends in Software Engineering","IT4140 - Industry Placement - 6 Months","IT4130 - Image Understanding & Processing","IT4070 - Preparation for the Professional World","IT4060 - Machine Learning"],
      2: ["SE4050 - Deep Learning","SE4040 - Enterprise Application Development","SE4030 - Secure Software Development","IT4140 - Industry Placement - 6 Months","IT4010 - Research Project","IE4060 - Robotics & Intelligent Systems"]
    }
  }
};

// Flatten all subjects from SUBJECTS constant
const ALL_SUBJECTS = [];
Object.values(SUBJECTS).forEach(prog =>
  Object.values(prog).forEach(years =>
    Object.values(years).forEach(subs => ALL_SUBJECTS.push(...subs))
  )
);
const UNIQUE_SUBJECTS = [...new Set(ALL_SUBJECTS)];

// ── GPA helpers ───────────────────────────────────────────────────────────────
function scoreToGPA(score) {
  if (score >= 85) return 4.0;
  if (score >= 75) return 3.7;
  if (score >= 70) return 3.3;
  if (score >= 65) return 3.0;
  if (score >= 60) return 2.7;
  if (score >= 55) return 2.3;
  if (score >= 50) return 2.0;
  if (score >= 40) return 1.7;
  return 0.0;
}

function getLetterGrade(score) {
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// ── Build analytics from raw QuizScore / extraction data ─────────────────────
// scores: array of { subject, score, grade?, status?, gpa?, studentNumber?, branch?, date? }
// subjectPerfOverride: pre-computed rows from profile (use grade/gpa as-is)
function buildAnalyticsFromScores(scores = [], subjectPerfOverride = []) {
  if (!scores.length) {
    console.warn('[Analytics] buildAnalyticsFromScores: no scores provided');
    return null;
  }

  const scoreValues = scores.map(s => {
    const val = parseFloat(s.score || 0);
    return isNaN(val) ? 0 : val;
  });
  
  if (!scoreValues.length) {
    console.warn('[Analytics] buildAnalyticsFromScores: no valid score values');
    return null;
  }

  const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
  const passRate = (scoreValues.filter(v => v >= 50).length / scoreValues.length) * 100;

  // Build a lookup from subjectPerfOverride so we can use backend-computed grade/gpa
  const perfLookup = {};
  subjectPerfOverride.forEach(s => { if (s.subject) perfLookup[s.subject] = s; });

  // Subject grouping
  const bySubject = {};
  scores.forEach(s => {
    const sub = s.subject || 'Unknown';
    if (!bySubject[sub]) bySubject[sub] = { vals: [], rows: [] };
    bySubject[sub].vals.push(parseFloat(s.score || 0));
    bySubject[sub].rows.push(s);
  });

  const subjectPerformance = Object.entries(bySubject).map(([subject, { vals, rows }]) => {
    const subAvg      = vals.reduce((a, b) => a + b, 0) / vals.length;
    const subPassRate = (vals.filter(v => v >= 50).length / vals.length) * 100;
    const override    = perfLookup[subject] || rows[0] || {};
    return {
      subject,
      average:       parseFloat(subAvg.toFixed(1)),
      passRate:      parseFloat(subPassRate.toFixed(1)),
      totalStudents: new Set(rows.map(r => r.studentId || r.studentNumber || 'me')).size,
      topScore:      Math.max(...vals),
      bottomScore:   Math.min(...vals),
      // prefer backend-computed values; recalculate only when missing
      grade:         override.grade  || getLetterGrade(subAvg),
      gpa:           override.gpa    != null ? override.gpa : scoreToGPA(subAvg),
      status:        override.status || (subAvg >= 50 ? 'Pass' : 'Fail'),
      distribution: {
        A: vals.filter(v => v >= 80).length,
        B: vals.filter(v => v >= 65 && v < 80).length,
        C: vals.filter(v => v >= 50 && v < 65).length,
        D: vals.filter(v => v >= 40 && v < 50).length,
        F: vals.filter(v => v < 40).length,
      }
    };
  }).sort((a, b) => b.average - a.average);

  // Grade distribution
  const gradeDistribution = [
    { name: 'A+ / A (75–100)', value: scoreValues.filter(v => v >= 75).length,  color: '#059669' },
    { name: 'B (65–74)',       value: scoreValues.filter(v => v >= 65 && v < 75).length, color: '#2563eb' },
    { name: 'C (50–64)',       value: scoreValues.filter(v => v >= 50 && v < 65).length, color: '#d97706' },
    { name: 'D (40–49)',       value: scoreValues.filter(v => v >= 40 && v < 50).length, color: '#ea580c' },
    { name: 'F (<40)',         value: scoreValues.filter(v => v < 40).length,  color: '#dc2626' },
  ];

  // Branch performance (group by branch if available)
  const byBranch = {};
  scores.forEach(s => {
    const branch = s.branch || 'Unknown';
    if (!byBranch[branch]) byBranch[branch] = [];
    byBranch[branch].push(parseFloat(s.score || 0));
  });
  const branchPerformance = Object.entries(byBranch).map(([branch, vals]) => ({
    branch,
    average:       parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
    passRate:      parseFloat(((vals.filter(v => v >= 50).length / vals.length) * 100).toFixed(1)),
    totalStudents: vals.length,
  }));

  // Monthly trend
  const byMonth = {};
  scores.forEach(s => {
    const d = s.date || s.uploadedAt || s.createdAt;
    if (!d) return;
    const key = new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(parseFloat(s.score || 0));
  });
  const performanceTrend = Object.entries(byMonth).map(([month, vals]) => ({
    month,
    average: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
    target: 75,
    students: vals.length,
  }));

  // Student list
  const byStudent = {};
  scores.forEach(s => {
    const id = s.studentNumber || s.studentId || s.student_number || 'unknown';
    if (!byStudent[id]) byStudent[id] = { id, name: s.name || id, studentNumber: id, branch: s.branch || '—', scores: [], subjects: new Set() };
    byStudent[id].scores.push(parseFloat(s.score || 0));
    if (s.subject) byStudent[id].subjects.add(s.subject);
  });
  const studentList = Object.values(byStudent).map(st => {
    const avg2 = st.scores.reduce((a, b) => a + b, 0) / st.scores.length;
    return {
      id: st.id,
      name: st.name,
      studentNumber: st.studentNumber,
      branch: st.branch,
      averageScore: parseFloat(avg2.toFixed(1)),
      totalAssessments: st.scores.length,
      trend: avg2 > 75 ? 'improving' : avg2 > 50 ? 'stable' : 'declining',
      subjects: [...st.subjects],
      grade: getLetterGrade(avg2),
      gpa: scoreToGPA(avg2),
    };
  });

  return {
    summary: {
      totalStudents:     studentList.length || scores.length,
      activeStudents:    studentList.length || scores.length,
      totalAssessments:  scores.length,
      averageScore:      parseFloat(avg.toFixed(1)),
      passRate:          parseFloat(passRate.toFixed(1)),
      topScore:          Math.max(...scoreValues),
      bottomScore:       Math.min(...scoreValues),
    },
    performanceTrend,
    subjectPerformance,
    branchPerformance,
    studentList,
    gradeDistribution,
  };
}

// ── Trend icon ────────────────────────────────────────────────────────────────
const TrendIcon = ({ trend }) => {
  if (trend === 'improving') return <RiseOutlined style={{ color: PALETTE.success }} />;
  if (trend === 'declining') return <FallOutlined  style={{ color: PALETTE.error   }} />;
  return <MinusOutlined style={{ color: PALETTE.warning }} />;
};

const trendTagColor = t =>
  t === 'improving' ? 'success' : t === 'declining' ? 'error' : 'warning';

// ── Empty state ───────────────────────────────────────────────────────────────
const NoData = ({ message: msg = 'No data available yet.' }) => (
  <div style={{
    textAlign: 'center', padding: '56px 24px',
    background: PALETTE.bg, borderRadius: 14,
    border: `1.5px dashed ${PALETTE.border}`,
  }}>
    <CloudUploadOutlined style={{ fontSize: 44, color: PALETTE.primary, opacity: 0.5 }} />
    <div style={{ marginTop: 16, fontSize: 16, fontWeight: 700, color: PALETTE.text }}>{msg}</div>
    <div style={{ marginTop: 8, fontSize: 13, color: PALETTE.textSm }}>
      Upload your marks file on the <a href="/upload" style={{ color: PALETTE.primary, fontWeight: 600 }}>Upload page</a> to populate analytics.
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading,           setLoading]           = useState(true);
  const [analyticsData,     setAnalyticsData]     = useState(null);
  const [rawScores,         setRawScores]         = useState([]);
  const [selectedView,      setSelectedView]      = useState('overview');
  const [chartType,         setChartType]         = useState('bar');
  const [selectedSubject,   setSelectedSubject]   = useState('all');
  const [selectedBranch,    setSelectedBranch]    = useState('all');
  const [sortBy,            setSortBy]            = useState('score');
  const [detailModalVisible,setDetailModalVisible]= useState(false);
  const [selectedStudent,   setSelectedStudent]   = useState(null);
  const [error,             setError]             = useState(null);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Unwrap any axios/API envelope: res → res.data → body.data
      const unwrap = (res) => {
        if (!res) return null;
        const body = res.data ?? res;
        if (body?.success === false) return null;
        return body?.data ?? body ?? null;
      };

      // Parse a single upload-result row into a score object
      const rowToScore = (row, meta = {}) => {
        // Subject: try every known column name your Excel/CSV might use
        const subject =
          row['Subject'] || row['subject'] ||
          row['Module Name'] || row['Module'] || row['module'] ||
          row['Course'] || row['course'] || row['Subject Name'] || '';

        // Score: CA Marks is what your Excel uses (seen in screenshot)
        const rawScore =
          row['CA Marks'] ?? row['ca_marks'] ?? row['CAMarks'] ??
          row['Marks'] ?? row['marks'] ?? row['Score'] ?? row['score'] ??
          row['Total'] ?? row['total'] ?? '';

        const numScore = parseFloat(String(rawScore).replace(/[^0-9.]/g, ''));
        if (!subject.trim() || isNaN(numScore) || numScore < 0) return null;

        return {
          subject:       subject.trim(),
          score:         numScore,
          grade:         row['Grade'] || row['grade'] || getLetterGrade(numScore),
          status:        row['Pass/Fail'] || row['Status'] || row['status'] ||
                         (numScore >= 50 ? 'Pass' : 'Fail'),
          studentNumber: row['Registration No'] || row['Reg No'] || row['RegNo'] ||
                         row['studentNumber'] || row['student_number'] ||
                         meta.studentId || '',
          name:          row['Name'] || row['name'] || row['Student Name'] || meta.name || '',
          branch:        meta.branch || '',
          date:          meta.date || new Date().toISOString(),
        };
      };

      // ── SOURCE 1: sessionStorage (set by UploadPage on every successful upload)
      // UploadPage stores the result in sessionStorage so analytics can read it
      // immediately without waiting for DB propagation.
      let scores = [];
      try {
        console.debug('[Analytics] === Checking all sessionStorage keys ===');
        console.debug('[Analytics] sessionStorage length:', sessionStorage.length);
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          console.debug('[Analytics] sessionStorage key:', key, 'size:', sessionStorage.getItem(key)?.length);
        }
        
        const cached = sessionStorage.getItem('analyticsScores');
        console.debug('[Analytics] found analyticsScores in sessionStorage?', !!cached);
        if (cached) {
          console.debug('[Analytics] analyticsScores length:', cached.length, 'bytes');
          console.debug('[Analytics] analyticsScores preview:', cached.substring(0, 300));
          const parsed = JSON.parse(cached);
          console.debug('[Analytics] parsed type:', typeof parsed, 'isArray?', Array.isArray(parsed));
          console.debug('[Analytics] parsed length:', parsed?.length);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Keep all rows with a valid subject (allow 0 scores too)
            scores = parsed.filter(row => {
              const subject = (row.subject || '').trim();
              return subject.length > 0;
            });
            console.debug('[Analytics] source=sessionStorage rows found:', scores.length);
            if (scores.length > 0) {
              console.debug('[Analytics] sample scores:', scores.slice(0, 3));
            }
          }
        }
      } catch (e) {
        console.error('[Analytics] sessionStorage parse error:', e);
      }

      // ── SOURCE 2: /api/profile  →  performance.subjectPerformance
      if (scores.length === 0) {
        const profileRaw = await profileService.getProfile().catch(() => null);
        const profile    = unwrap(profileRaw);
        const subjectPerf = profile?.performance?.subjectPerformance || [];
        const studentNum  = profile?.personalInfo?.studentNumber || user?.studentId || '';
        const studentName = profile?.personalInfo?.name          || user?.name      || '';
        const branch      = profile?.academicInfo?.branch        || '';

        console.debug('[Analytics] profile subjectPerf:', subjectPerf.length, 'rows');

        if (subjectPerf.length > 0) {
          scores = subjectPerf.map(s => ({
            subject:       s.subject,
            score:         parseFloat(s.score ?? s.average ?? 0),
            grade:         s.grade,
            status:        s.status,
            gpa:           s.gpa,
            studentNumber: studentNum,
            name:          studentName,
            branch,
            date:          new Date().toISOString(),
          }));
          console.debug('[Analytics] source=profile rows:', scores.length);
        }
      }

      // ── SOURCE 3: /api/upload/extractions  (your upload history endpoint)
      // getExtractionHistory() returns { data: [{ preview, studentId, branch, uploadedAt }] }
      if (scores.length === 0) {
        try {
          const uploadMod = await import('../services/upload.service');
          const uploadSvc = uploadMod.default || uploadMod;
          const histRaw   = await uploadSvc.getExtractionHistory().catch(() => null);
          const histBody  = unwrap(histRaw);
          console.debug('[Analytics] history raw:', histBody);

          // The history array may be at .data, top-level array, or .extractions
          const entries = Array.isArray(histBody)
            ? histBody
            : (histBody?.extractions ?? histBody?.data ?? histBody?.records ?? []);

          entries.forEach(entry => {
            const rows = entry.preview || entry.rows || entry.data || [];
            const meta = {
              studentId: entry.studentId || entry.student_id || '',
              branch:    entry.branch    || '',
              name:      entry.fullName  || entry.name || '',
              date:      entry.uploadedAt || entry.processedAt || new Date().toISOString(),
            };
            rows.forEach(row => {
              const s = rowToScore(row, meta);
              if (s) scores.push(s);
            });
          });
          console.debug('[Analytics] source=history rows:', scores.length);
        } catch (e) {
          console.warn('[Analytics] history fetch failed:', e.message);
        }
      }

      // ── SOURCE 4: /api/analytics/student/:id  (per-student dashboard)
      if (scores.length === 0) {
        const userId = user?.id || user?._id || user?.studentId;
        if (userId) {
          const dashRaw = await analyticsService.getStudentDashboard(userId).catch(() => null);
          const dash    = unwrap(dashRaw);
          console.debug('[Analytics] dashboard:', dash);

          const dashSubj = dash?.subjects || [];
          const dashAct  = (dash?.recentActivity || []).filter(a => a.type === 'quiz');

          [...dashSubj, ...dashAct].forEach(s => {
            const score = parseFloat(
              s.statistics?.average ?? s.average ?? s.score ?? 0
            );
            const subject = s.subject || s.name || s.action || '';
            if (subject && score > 0) {
              scores.push({
                subject, score,
                grade:         s.grade || getLetterGrade(score),
                status:        s.status || (score >= 50 ? 'Pass' : 'Fail'),
                studentNumber: user?.studentId || userId,
                name:          user?.name || '',
                branch:        '',
                date:          s.date || new Date().toISOString(),
              });
            }
          });
          console.debug('[Analytics] source=dashboard rows:', scores.length);
        }
      }

      if (scores.length > 0) {
        console.debug('[Analytics] found', scores.length, 'scores, building analytics...');
        setRawScores(scores);
        const built = buildAnalyticsFromScores(scores);
        console.debug('[Analytics] buildAnalyticsFromScores returned:', built);
        setAnalyticsData(built);
      } else {
        console.warn('[Analytics] no score data found in any source');
        console.warn('[Analytics] sessionStorage.analyticsScores:', sessionStorage.getItem('analyticsScores')?.substring(0, 200));
        setAnalyticsData(null);
      }

    } catch (err) {
      console.error('[Analytics] fatal error:', err);
      setError('Failed to load analytics. Check console for details.');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAnalyticsData(); }, [loadAnalyticsData]);

  // Enrich backend data with letter grades / GPA where missing
  function enrichWithSubjectDetails(d) {
    return {
      ...d,
      subjectPerformance: (d.subjectPerformance || []).map(s => ({
        ...s,
        grade: s.grade || getLetterGrade(s.average),
        gpa:   s.gpa   || scoreToGPA(s.average),
        status: s.status || (s.average >= 50 ? 'Pass' : 'Fail'),
      })),
    };
  }

  // ── Derived subject options (from real data + SUBJECTS list) ────────────────
  const knownSubjects = analyticsData?.subjectPerformance?.map(s => s.subject) || [];
  const subjectOptions = [...new Set([...knownSubjects, ...UNIQUE_SUBJECTS])];

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredSubjectPerf = (analyticsData?.subjectPerformance || []).filter(s =>
    selectedSubject === 'all' || s.subject === selectedSubject
  );

  const filteredStudentList = (analyticsData?.studentList || [])
    .filter(s => selectedBranch === 'all' || s.branch === selectedBranch)
    .sort((a, b) => {
      if (sortBy === 'score') return b.averageScore - a.averageScore;
      if (sortBy === 'name')  return a.name.localeCompare(b.name);
      return a.branch?.localeCompare(b.branch || '') || 0;
    });

  // ── Student detail columns ──────────────────────────────────────────────────
  const studentColumns = [
    {
      title: 'Student', dataIndex: 'name', key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" style={{ background: PALETTE.primary }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.studentNumber}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Branch', dataIndex: 'branch', key: 'branch',
      render: b => <Tag color="blue">{b || '—'}</Tag>,
    },
    {
      title: 'Avg Score', dataIndex: 'averageScore', key: 'averageScore',
      sorter: (a, b) => a.averageScore - b.averageScore,
      render: score => (
        <Space>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', border: `3px solid ${scoreColor(score)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: scoreColor(score),
          }}>
            {score}%
          </div>
        </Space>
      ),
    },
    {
      title: 'Grade', dataIndex: 'grade', key: 'grade',
      render: g => <Tag color={g?.startsWith('A') ? 'green' : g?.startsWith('B') ? 'blue' : g?.startsWith('C') ? 'orange' : 'red'}>{g || '—'}</Tag>,
    },
    {
      title: 'GPA', dataIndex: 'gpa', key: 'gpa',
      render: g => <Text strong style={{ color: PALETTE.primary }}>{(g || 0).toFixed(2)}</Text>,
    },
    {
      title: 'Assessments', dataIndex: 'totalAssessments', key: 'totalAssessments',
      render: c => <Badge count={c} style={{ background: PALETTE.purple }} />,
    },
    {
      title: 'Trend', dataIndex: 'trend', key: 'trend',
      render: trend => (
        <Tag icon={<TrendIcon trend={trend} />} color={trendTagColor(trend)}>
          {trend}
        </Tag>
      ),
    },
    {
      title: 'Subjects', dataIndex: 'subjects', key: 'subjects',
      render: subs => (
        <Space wrap size={[4, 4]}>
          {(subs || []).slice(0, 2).map(s => (
            <Tag key={s} color="geekblue" style={{ fontSize: 10 }}>
              {s.split(' - ')[0] || s}
            </Tag>
          ))}
          {(subs || []).length > 2 && <Tag>+{subs.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />}
          onClick={() => { setSelectedStudent(record); setDetailModalVisible(true); }}>
          Details
        </Button>
      ),
    },
  ];

  // ── Subject performance table columns ───────────────────────────────────────
  const subjectColumns = [
    {
      title: 'Subject', dataIndex: 'subject', key: 'subject',
      render: t => <Text strong style={{ fontSize: 13 }}>{t}</Text>,
    },
    {
      title: 'Average', dataIndex: 'average', key: 'average',
      sorter: (a, b) => a.average - b.average,
      render: v => (
        <Space>
          <Progress percent={v} size="small" style={{ width: 80 }}
            strokeColor={scoreColor(v)} showInfo={false} />
          <Text strong style={{ color: scoreColor(v) }}>{v}%</Text>
        </Space>
      ),
    },
    { title: 'Grade', dataIndex: 'grade', key: 'grade',
      render: g => <Tag color={gradeColor(g)} style={{ fontWeight: 700 }}>{g}</Tag> },
    { title: 'GPA', dataIndex: 'gpa', key: 'gpa',
      render: g => <Text strong style={{ color: PALETTE.primary }}>{(g || 0).toFixed(1)}</Text> },
    { title: 'Pass Rate', dataIndex: 'passRate', key: 'passRate',
      render: v => <Progress percent={Math.round(v)} size="small" style={{ width: 90 }}
        strokeColor={v >= 75 ? PALETTE.success : v >= 50 ? PALETTE.warning : PALETTE.error} /> },
    { title: 'Students', dataIndex: 'totalStudents', key: 'totalStudents' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: s => <Tag color={s === 'Pass' ? 'success' : 'error'}
        icon={s === 'Pass' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>{s}</Tag> },
  ];

  // ══ RENDER ═══════════════════════════════════════════════════════════════════

  // ── Overview tab ───────────────────────────────────────────────────────────
  const renderOverview = () => {
    if (!analyticsData) return <NoData />;
    const { summary, performanceTrend, subjectPerformance, gradeDistribution } = analyticsData;

    return (
      <>
        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { title: 'Total Students',      value: summary.totalStudents,    suffix: '',   color: PALETTE.primary, icon: <TeamOutlined /> },
            { title: 'Average Score',        value: summary.averageScore,     suffix: '%',  color: PALETTE.success, icon: <BookOutlined /> },
            { title: 'Pass Rate',            value: summary.passRate,         suffix: '%',  color: PALETTE.warning, icon: <TrophyOutlined /> },
            { title: 'Total Assessments',    value: summary.totalAssessments, suffix: '',   color: PALETTE.purple,  icon: <BarChartOutlined /> },
          ].map((m, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card hoverable style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}>
                <Statistic title={m.title} value={m.value} precision={1}
                  suffix={m.suffix} prefix={m.icon}
                  valueStyle={{ color: m.color, fontWeight: 800 }} />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {i === 0 && `Top: ${summary.topScore}%`}
                    {i === 1 && `Highest: ${summary.topScore}%`}
                    {i === 2 && `Target: 75%`}
                    {i === 3 && `${subjectPerformance?.length || 0} subjects tracked`}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Performance Trend */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
              title={<Space><LineChartOutlined style={{ color: PALETTE.primary }} /><span>Performance Trend</span></Space>}
              extra={
                <Radio.Group value={chartType} onChange={e => setChartType(e.target.value)} size="small">
                  <Radio.Button value="line">Line</Radio.Button>
                  <Radio.Button value="area">Area</Radio.Button>
                  <Radio.Button value="bar">Bar</Radio.Button>
                </Radio.Group>
              }
            >
              {(performanceTrend || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  {chartType === 'area' ? (
                    <AreaChart data={performanceTrend}>
                      <defs>
                        <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={PALETTE.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: 10 }} />
                      <Legend />
                      <Area type="monotone" dataKey="average" name="Avg Score" stroke={PALETTE.primary} fill="url(#avgGrad)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="target"  name="Target 75%" stroke={PALETTE.error} fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
                    </AreaChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: 10 }} />
                      <Legend />
                      <Bar dataKey="average" name="Avg Score" fill={PALETTE.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target"  name="Target 75%" fill={PALETTE.error} radius={[4, 4, 0, 0]} opacity={0.4} />
                    </BarChart>
                  ) : (
                    <LineChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: 10 }} />
                      <Legend />
                      <Line type="monotone" dataKey="average" name="Avg Score" stroke={PALETTE.primary} strokeWidth={2.5} dot={{ r: 4, fill: PALETTE.primary }} />
                      <Line type="monotone" dataKey="target"  name="Target 75%" stroke={PALETTE.error} strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <NoData message="Upload marks to see performance trends" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Subject Performance Bar + Grade Pie */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
              title={<Space><BarChartOutlined style={{ color: PALETTE.primary }} /><span>Subject Performance</span></Space>}>
              {(subjectPerformance || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={subjectPerformance.slice(0, 10)}
                    layout="vertical" margin={{ left: 160, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="subject" width={160}
                      tick={{ fontSize: 10, fill: PALETTE.textMd }}
                      tickFormatter={v => v.length > 28 ? v.slice(0, 28) + '…' : v} />
                    <RechartsTooltip contentStyle={{ borderRadius: 10 }}
                      formatter={(val, name) => [`${val}%`, name]} />
                    <Legend />
                    <Bar dataKey="average"  name="Avg Score" radius={[0, 4, 4, 0]}
                      fill={PALETTE.primary}>
                      {(subjectPerformance || []).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="passRate" name="Pass Rate %" radius={[0, 4, 4, 0]}
                      fill={PALETTE.success} opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData message="No subject data yet" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}`, height: '100%' }}
              title={<Space><PieChartOutlined style={{ color: PALETTE.primary }} /><span>Grade Distribution</span></Space>}>
              {(gradeDistribution || []).some(g => g.value > 0) ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={gradeDistribution.filter(g => g.value > 0)}
                      cx="50%" cy="45%" outerRadius={90} dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                      {gradeDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val, name) => [val + ' students', name]} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <NoData message="No grade data yet" />
              )}
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  // ── Subjects tab ────────────────────────────────────────────────────────────
  const renderSubjects = () => {
    if (!analyticsData) return <NoData />;
    const { subjectPerformance } = analyticsData;

    // Radar chart for top subjects
    const radarData = (subjectPerformance || []).slice(0, 8).map(s => ({
      subject: s.subject.split(' - ')[0] || s.subject,
      score:   s.average,
      passRate: s.passRate,
    }));

    return (
      <Row gutter={[16, 16]}>
        {/* Radar */}
        {radarData.length > 2 && (
          <Col span={24}>
            <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
              title={<Space><PieChartOutlined style={{ color: PALETTE.purple }} /><span>Subject Radar</span></Space>}>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={PALETTE.border} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: PALETTE.textMd }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Avg Score" dataKey="score" stroke={PALETTE.primary} fill={PALETTE.primary} fillOpacity={0.25} />
                  <Radar name="Pass Rate" dataKey="passRate" stroke={PALETTE.success} fill={PALETTE.success} fillOpacity={0.15} />
                  <Legend />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* Cards grid */}
        {(subjectPerformance || []).map((s, i) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={i}>
            <Card hoverable style={{
              borderRadius: 14,
              border: `2px solid ${scoreColor(s.average)}20`,
              background: s.status === 'Pass' ? PALETTE.successBg : PALETTE.errorBg,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.textSm, marginBottom: 8, lineHeight: 1.3 }}>
                {s.subject}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: scoreColor(s.average) }}>{s.average}%</span>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={s.grade?.startsWith('A') ? 'green' : s.grade?.startsWith('B') ? 'blue' : s.grade?.startsWith('C') ? 'orange' : 'red'}
                    style={{ fontWeight: 700, fontSize: 14, padding: '2px 8px' }}>{s.grade}</Tag>
                </div>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ width: `${s.average}%`, height: '100%', background: scoreColor(s.average), borderRadius: 3, transition: 'width 0.8s' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag color={s.status === 'Pass' ? 'success' : 'error'} icon={s.status === 'Pass' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                  {s.status}
                </Tag>
                <Tag style={{ background: PALETTE.primaryBg, color: PALETTE.primary, border: `1px solid ${PALETTE.primaryLt}` }}>
                  GPA {(s.gpa || 0).toFixed(1)}
                </Tag>
                <Tag color="default">Pass {s.passRate}%</Tag>
              </div>
              {/* Grade distribution mini bar */}
              {s.distribution && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: PALETTE.textSm, marginBottom: 4, fontWeight: 600 }}>Distribution</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Object.entries(s.distribution).map(([g, cnt]) => cnt > 0 && (
                      <Tooltip key={g} title={`${g}: ${cnt}`}>
                        <div style={{
                          flex: cnt, height: 6, borderRadius: 2,
                          background: g === 'A' ? PALETTE.success : g === 'B' ? PALETTE.primary : g === 'C' ? PALETTE.warning : g === 'D' ? '#f59e0b' : PALETTE.error,
                        }} />
                      </Tooltip>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {Object.entries(s.distribution).map(([g, cnt]) => cnt > 0 && (
                      <Text key={g} style={{ fontSize: 10, color: PALETTE.textSm }}>{g}:{cnt}</Text>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        ))}

        {/* Full table */}
        <Col span={24}>
          <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
            title="All Subjects Detail"
            extra={
              <Select value={selectedSubject} onChange={setSelectedSubject} size="small" style={{ width: 220 }}>
                <Option value="all">All Subjects</Option>
                {subjectOptions.map(s => <Option key={s} value={s}>{s.length > 40 ? s.slice(0, 40) + '…' : s}</Option>)}
              </Select>
            }
          >
            <Table dataSource={filteredSubjectPerf} columns={subjectColumns}
              rowKey="subject" size="small" pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="No subject data. Upload a marks file to see this data." /> }} />
          </Card>
        </Col>
      </Row>
    );
  };

  // ── Branches tab ────────────────────────────────────────────────────────────
  const renderBranches = () => {
    if (!analyticsData) return <NoData />;
    const { branchPerformance } = analyticsData;

    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
            title={<Space><GlobalOutlined style={{ color: PALETTE.primary }} /><span>Branch Performance Comparison</span></Space>}
            extra={
              <Select value={selectedBranch} onChange={setSelectedBranch} size="small" style={{ width: 160 }}>
                <Option value="all">All Branches</Option>
                {(branchPerformance || []).map(b => <Option key={b.branch} value={b.branch}>{b.branch}</Option>)}
              </Select>
            }
          >
            {(branchPerformance || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} />
                  <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 10 }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="average"  name="Avg Score %"  fill={PALETTE.primary} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="passRate" name="Pass Rate %"  fill={PALETTE.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoData message="No branch data found in uploaded marks" />
            )}
          </Card>
        </Col>

        {(branchPerformance || []).map((b, i) => (
          <Col xs={24} sm={12} md={8} key={i}>
            <Card hoverable style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: PALETTE.text, marginBottom: 12 }}>
                🏢 {b.branch}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Statistic title="Avg Score" value={b.average} suffix="%" precision={1}
                  valueStyle={{ color: scoreColor(b.average), fontSize: 22, fontWeight: 800 }} />
                <Statistic title="Pass Rate" value={b.passRate} suffix="%" precision={1}
                  valueStyle={{ color: PALETTE.success, fontSize: 22, fontWeight: 800 }} />
                <Statistic title="Students" value={b.totalStudents}
                  valueStyle={{ color: PALETTE.purple, fontSize: 22, fontWeight: 800 }} />
              </div>
              <Progress percent={Math.round(b.passRate)} size="small"
                strokeColor={b.passRate >= 75 ? PALETTE.success : b.passRate >= 50 ? PALETTE.warning : PALETTE.error}
                style={{ marginTop: 12 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // ── Students tab ────────────────────────────────────────────────────────────
  const renderStudents = () => {
    if (!analyticsData) return <NoData />;
    return (
      <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
        title={<Space><TeamOutlined style={{ color: PALETTE.primary }} /><span>Student Performance</span></Space>}
        extra={
          <Space>
            <Select value={sortBy} onChange={setSortBy} size="small"
              suffixIcon={<SortAscendingOutlined />} style={{ width: 140 }}>
              <Option value="score">By Score</Option>
              <Option value="name">By Name</Option>
              <Option value="branch">By Branch</Option>
            </Select>
            <Select value={selectedBranch} onChange={setSelectedBranch} size="small" style={{ width: 130 }}>
              <Option value="all">All Branches</Option>
              {(analyticsData?.branchPerformance || []).map(b =>
                <Option key={b.branch} value={b.branch}>{b.branch}</Option>)}
            </Select>
          </Space>
        }
      >
        <Table columns={studentColumns} dataSource={filteredStudentList}
          rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: true }} size="small"
          locale={{ emptyText: <Empty description="No student data. Upload a marks file to see this data." /> }} />
      </Card>
    );
  };

  // ── Insights tab ────────────────────────────────────────────────────────────
  const renderInsights = () => {
    if (!analyticsData) return <NoData />;
    const { summary, subjectPerformance } = analyticsData;
    const topSubject     = (subjectPerformance || [])[0];
    const bottomSubject  = (subjectPerformance || []).slice(-1)[0];
    const failingSubjects= (subjectPerformance || []).filter(s => s.status === 'Fail');
    const avgGPA = summary.averageScore ? parseFloat(scoreToGPA(summary.averageScore).toFixed(2)) : 0;

    const insights = [
      topSubject && {
        icon: '🏆', color: PALETTE.warning,
        text: 'Best subject: ',
        bold: `${topSubject.subject.split(' - ')[0]} (${topSubject.average}%)`,
        tail: ` — Grade ${topSubject.grade}, GPA ${(topSubject.gpa || 0).toFixed(1)}`
      },
      bottomSubject && bottomSubject !== topSubject && {
        icon: '📉', color: PALETTE.error,
        text: 'Needs improvement: ',
        bold: `${bottomSubject.subject.split(' - ')[0]} (${bottomSubject.average}%)`,
        tail: `. Consider additional study sessions.`
      },
      failingSubjects.length > 0 && {
        icon: '⚠', color: PALETTE.error,
        text: `${failingSubjects.length} subject(s) below pass threshold: `,
        bold: failingSubjects.map(s => s.subject.split(' - ')[0]).join(', '),
        tail: `. Immediate attention required.`
      },
      {
        icon: '◎', color: PALETTE.primary,
        text: 'Overall class average is ',
        bold: `${summary.averageScore}%`,
        tail: ` with a pass rate of ${summary.passRate}%.`
      },
      avgGPA > 0 && {
        icon: '🎓', color: PALETTE.purple,
        text: 'Estimated GPA: ',
        bold: `${avgGPA} / 4.0`,
        tail: ` — ${avgGPA >= 3.5 ? 'Excellent Standing' : avgGPA >= 2.5 ? 'Good Standing' : avgGPA >= 2.0 ? 'Satisfactory' : 'At Risk'}`
      },
    ].filter(Boolean);

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}`, marginBottom: 16 }}
            title={<Space>🤖<span>AI-Generated Insights</span></Space>}>
            <List
              dataSource={insights}
              renderItem={item => (
                <List.Item style={{ padding: '14px 0', borderBottom: `1px solid ${PALETTE.border}` }}>
                  <Space align="start">
                    <span style={{ fontSize: 20, color: item.color, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ fontSize: 13, color: PALETTE.textMd, lineHeight: 1.6 }}>
                      {item.text}
                      <strong style={{ color: PALETTE.text }}>{item.bold}</strong>
                      {item.tail}
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          {/* Failing subjects alert */}
          {failingSubjects.length > 0 && (
            <Alert type="error" showIcon icon={<WarningOutlined />}
              style={{ borderRadius: 12, marginBottom: 16 }}
              message="Subjects Requiring Attention"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {failingSubjects.map(s => (
                    <li key={s.subject}>
                      <strong>{s.subject.split(' - ')[0]}</strong> — {s.average}% (Grade {s.grade})
                    </li>
                  ))}
                </ul>
              }
            />
          )}

          {/* Recommendations */}
          <Card style={{ borderRadius: 12, border: `1px solid ${PALETTE.border}` }}
            title="📌 Recommendations">
            <Row gutter={[12, 12]}>
              {[
                { emoji: '📚', title: 'Focus on Weak Subjects', desc: `Dedicate extra time to ${bottomSubject?.subject?.split(' - ')[0] || 'low-scoring subjects'}`, prog: Math.min(100, (bottomSubject?.average || 50)), color: PALETTE.error },
                { emoji: '🎯', title: 'Maintain Pass Rate',     desc: `Current: ${summary.passRate}% — Target: 75%`,  prog: summary.passRate, color: PALETTE.warning },
                { emoji: '⭐', title: 'Boost Top Subjects',     desc: `${topSubject?.subject?.split(' - ')[0] || 'Best subject'} is at ${topSubject?.average || 0}%`, prog: topSubject?.average || 0, color: PALETTE.success },
              ].map((r, i) => (
                <Col span={24} key={i}>
                  <div style={{ background: PALETTE.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${PALETTE.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{r.emoji}</span>
                      <Text strong style={{ fontSize: 13 }}>{r.title}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.desc}</Text>
                    <Progress percent={Math.round(r.prog)} size="small"
                      strokeColor={r.color} style={{ marginTop: 8 }} />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  // ── MAIN RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="analytics-page" style={{ background: PALETTE.bg, minHeight: '100vh', padding: '24px 28px' }}>

      {/* Header */}
      <Card style={{ marginBottom: 24, borderRadius: 14, border: `1px solid ${PALETTE.border}` }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.purple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChartOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <div>
                <Title level={3} style={{ margin: 0 }}>Analytics Dashboard</Title>
                <Text type="secondary">Comprehensive performance analysis from uploaded marks</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadAnalyticsData} loading={loading}>
                Refresh
              </Button>
              <Button type="primary" icon={<DownloadOutlined />}>
                Export Report
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Error state */}
      {error && (
        <Alert type="warning" showIcon message={error}
          action={<Button size="small" onClick={loadAnalyticsData}>Retry</Button>}
          style={{ marginBottom: 24, borderRadius: 12 }} />
      )}

      {/* No data prompt */}
      {!loading && !analyticsData && !error && (
        <Card style={{ borderRadius: 14, marginBottom: 24, border: `1px solid ${PALETTE.border}` }}>
          <NoData message="No analytics data found. Upload a marks file to get started." />
        </Card>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: PALETTE.textMd }}>Loading analytics from your marks data…</div>
        </div>
      ) : analyticsData && (
        <>
          {/* View selector */}
          <Card style={{ marginBottom: 20, borderRadius: 12, border: `1px solid ${PALETTE.border}` }}>
            <Radio.Group value={selectedView}
              onChange={e => setSelectedView(e.target.value)}
              buttonStyle="solid" size="large">
              <Radio.Button value="overview">📊 Overview</Radio.Button>
              <Radio.Button value="subjects">📚 Subjects</Radio.Button>
              <Radio.Button value="branches">🏢 Branches</Radio.Button>
              <Radio.Button value="students">👥 Students</Radio.Button>
              <Radio.Button value="insights">💡 Insights</Radio.Button>
            </Radio.Group>
          </Card>

          {selectedView === 'overview'  && renderOverview()}
          {selectedView === 'subjects'  && renderSubjects()}
          {selectedView === 'branches'  && renderBranches()}
          {selectedView === 'students'  && renderStudents()}
          {selectedView === 'insights'  && renderInsights()}
        </>
      )}

      {/* Student Detail Modal */}
      <Modal
        title="Student Performance Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={680}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>Close</Button>,
          <Button key="export" type="primary" icon={<DownloadOutlined />}>Export</Button>,
        ]}
      >
        {selectedStudent && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Name" span={2}>
                <Space>
                  <Avatar icon={<UserOutlined />} style={{ background: PALETTE.primary }} />
                  <Text strong>{selectedStudent.name}</Text>
                  <Text type="secondary">({selectedStudent.studentNumber})</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Branch">
                <Tag color="blue">{selectedStudent.branch}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Average Score">
                <Text strong style={{ color: scoreColor(selectedStudent.averageScore), fontSize: 18 }}>
                  {selectedStudent.averageScore}%
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Grade">
                <Tag color={selectedStudent.grade?.startsWith('A') ? 'green' : selectedStudent.grade?.startsWith('B') ? 'blue' : 'orange'}
                  style={{ fontWeight: 700, fontSize: 14 }}>
                  {selectedStudent.grade}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="GPA">
                <Text strong style={{ color: PALETTE.primary }}>
                  {(selectedStudent.gpa || 0).toFixed(2)} / 4.0
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trend">
                <Tag icon={<TrendIcon trend={selectedStudent.trend} />}
                  color={trendTagColor(selectedStudent.trend)}>
                  {selectedStudent.trend}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Assessments">
                {selectedStudent.totalAssessments}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Subjects</Divider>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(selectedStudent.subjects || []).map(s => (
                <Tag key={s} color="geekblue">{s}</Tag>
              ))}
            </div>

            <Divider>Recommendations</Divider>
            <List
              size="small"
              dataSource={[
                selectedStudent.averageScore < 50  && `⚠️ Average score (${selectedStudent.averageScore}%) is below the pass threshold — urgent revision needed`,
                selectedStudent.averageScore < 75  && `📖 Consider increasing study hours to reach the 75% target`,
                selectedStudent.trend === 'declining' && `📉 Performance trend is declining — review weak subjects`,
                selectedStudent.averageScore >= 75 && `✅ Performing above pass threshold — keep the momentum`,
              ].filter(Boolean)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta avatar={<BulbOutlined style={{ color: PALETTE.warning }} />} description={item} />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default AnalyticsPage;