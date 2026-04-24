import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Statistic, Row, Col, Input, Select, Button,
  Spin, Empty, Tag, Space, Modal, Avatar, Alert, Progress,
  Tabs, Badge, Tooltip, Descriptions, List, Divider
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, LogoutOutlined,
  UserOutlined, ReloadOutlined, WarningOutlined, TrophyOutlined,
  RiseOutlined, FallOutlined, MinusOutlined, BulbOutlined,
  TeamOutlined, BookOutlined, BarChartOutlined, CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import analyticsService from '../services/analytics.service';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const { TabPane } = Tabs;

// ── Palette ──────────────────────────────────────────────────────────────────
const P = {
  primary:   '#2563eb',
  success:   '#059669',
  warning:   '#d97706',
  error:     '#dc2626',
  purple:    '#7c3aed',
  cyan:      '#0891b2',
  text:      '#0f172a',
  textMd:    '#475569',
  textSm:    '#94a3b8',
  border:    '#e2e8f0',
  bg:        '#f8fafc',
  cardBg:    '#ffffff',
};

const CHART_COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d'];

const scoreColor = s => s >= 75 ? P.success : s >= 55 ? P.warning : P.error;
const statusColor = s => ({
  'Excellent': 'success', 'Good': 'processing',
  'Below Average': 'warning', 'At Risk': 'error', 'No Data': 'default'
}[s] || 'default');

const TrendIcon = ({ trend }) => {
  if (trend === 'improving' || trend === 'Improving') return <RiseOutlined style={{ color: P.success }} />;
  if (trend === 'declining' || trend === 'Declining') return <FallOutlined style={{ color: P.error }} />;
  return <MinusOutlined style={{ color: P.warning }} />;
};

// GPA helpers (match backend formula)
const calcGPA = avg => parseFloat(Math.max(0, Math.min(4.0, ((avg - 40) / 60) * 4.0)).toFixed(2));

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [loading, setLoading]           = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents]         = useState([]);
  const [searchText, setSearchText]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError]               = useState(null);
  const [detailStudent, setDetailStudent] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Data fetch with multiple fallbacks ────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data = null;

      // PRIMARY: admin dashboard endpoint
      try {
        const res = await analyticsService.getAdminDashboard();
        if (res?.success && res?.data) {
          data = res.data;
        }
      } catch (adminErr) {
        console.warn('[AdminDash] admin/dashboard failed:', adminErr.message);
      }

      // FALLBACK 1: analytics overview endpoint
      if (!data || (data.summary?.totalStudents === 0 && data.summary?.totalAssessments === 0)) {
        try {
          const overviewRes = await analyticsService.getAnalyticsData();
          if (overviewRes?.success && overviewRes?.data) {
            const od = overviewRes.data;
            data = {
              summary: od.summary || {},
              students: (od.studentList || []).map(s => ({
                id: s.id,
                name: s.name,
                studentNumber: s.studentNumber,
                email: s.email || '',
                program: s.program || '',
                branch: s.branch || '',
                year: s.year || '',
                semester: s.semester || '',
                latestScore: s.averageScore,
                averageScore: s.averageScore,
                gpa: s.gpa || calcGPA(s.averageScore),
                totalAssessments: s.totalAssessments,
                subjects: s.subjects || [],
                status: s.totalAssessments === 0 ? 'No Data'
                  : s.averageScore >= 75 ? 'Excellent'
                  : s.averageScore >= 65 ? 'Good'
                  : s.averageScore >= 50 ? 'Below Average' : 'At Risk',
                predictedScore: s.averageScore,
                trend: s.trend || 'stable',
              })),
              topStudents: [],
              atRiskStudents: [],
              performanceTrend: od.performanceTrend || [],
              subjectPerformance: (od.subjectPerformance || []).map(s => ({
                name: s.subject,
                average: s.average,
                passRate: s.passRate,
                gpa: calcGPA(s.average),
                totalAssessments: s.totalStudents || 0,
                distribution: s.distribution || {},
              })),
              gradeDistribution: od.gradeDistribution || [],
              branchPerformance: od.branchPerformance || [],
            };
          }
        } catch (overviewErr) {
          console.warn('[AdminDash] overview fallback failed:', overviewErr.message);
        }
      }

      // FALLBACK 2: class summary
      if (!data) {
        try {
          const summaryRes = await analyticsService.getClassSummary();
          if (summaryRes?.success && summaryRes?.data) {
            const sd = summaryRes.data;
            data = {
              summary: {
                totalStudents: sd.totalStudents || 0,
                totalAssessments: sd.totalAssessments || 0,
                averageScore: 0, averageGPA: 0, passRate: 0,
              },
              students: [],
              topStudents: [], atRiskStudents: [],
              performanceTrend: [], branchPerformance: [],
              subjectPerformance: sd.subjectAverages
                ? Object.entries(sd.subjectAverages).map(([name, val]) => ({
                    name,
                    average: parseFloat((val.average || 0).toFixed(1)),
                    passRate: 0,
                    gpa: calcGPA(val.average || 0),
                    totalAssessments: val.count || 0,
                    distribution: {},
                  }))
                : [],
            };
          }
        } catch (e) {
          console.warn('[AdminDash] class summary fallback failed:', e.message);
        }
      }

      if (data) {
        // Ensure all student fields are populated
        const processedStudents = (data.students || []).map(s => ({
          ...s,
          gpa: s.gpa ?? calcGPA(s.averageScore || 0),
          status: s.status || (
            s.totalAssessments === 0 ? 'No Data' :
            s.averageScore >= 75 ? 'Excellent' :
            s.averageScore >= 65 ? 'Good' :
            s.averageScore >= 50 ? 'Below Average' : 'At Risk'
          ),
          trend: s.trend || (s.averageScore >= 75 ? 'improving' : s.averageScore >= 50 ? 'stable' : 'declining'),
          predictedScore: s.predictedScore ?? s.averageScore ?? 0,
        }));

        const withData = processedStudents.filter(s => s.totalAssessments > 0);

        data.students = processedStudents;
        if (!data.topStudents?.length) {
          data.topStudents = [...withData].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10);
        }
        if (!data.atRiskStudents?.length) {
          data.atRiskStudents = withData.filter(s => s.averageScore < 65).sort((a, b) => a.averageScore - b.averageScore).slice(0, 10);
        }
        if (!data.summary?.averageGPA && withData.length) {
          const gpas = withData.map(s => s.gpa || 0);
          data.summary.averageGPA = parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2));
        }

        setDashboardData(data);
        setStudents(processedStudents);

        const total = data.summary?.totalStudents || 0;
        toast.success(
          total === 0
            ? 'Connected — but no students found in the database yet.'
            : `Loaded ${total} students (${withData.length} with assessment data)`
        );
      } else {
        setError('Could not fetch any data. Please ensure the backend is running and the database has student records.');
        toast.error('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('[AdminDash] Fatal error:', err);
      setError(`Dashboard error: ${err.message}`);
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/login'); return; }
    fetchDashboardData();
  }, [user, navigate, fetchDashboardData]);

  // ── Filtered students ─────────────────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    const q = searchText.toLowerCase();
    const matchText = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentNumber?.toLowerCase().includes(q) ||
      s.branch?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchText && matchStatus;
  });

  const summary       = dashboardData?.summary || {};
  const perfTrend     = dashboardData?.performanceTrend || [];
  const subjectPerf   = dashboardData?.subjectPerformance || [];
  const branchPerf    = dashboardData?.branchPerformance || [];
  const topStudents   = dashboardData?.topStudents || [];
  const atRiskStudents = dashboardData?.atRiskStudents || [];

  const scoreDistribution = [
    { name: 'Excellent ≥80%', value: students.filter(s => s.averageScore >= 80).length,                               fill: P.success },
    { name: 'Good 65–79%',    value: students.filter(s => s.averageScore >= 65 && s.averageScore < 80).length,        fill: P.primary },
    { name: 'Average 50–64%', value: students.filter(s => s.averageScore >= 50 && s.averageScore < 65).length,        fill: P.warning },
    { name: 'At Risk <50%',   value: students.filter(s => s.averageScore > 0 && s.averageScore < 50).length,          fill: P.error },
  ].filter(d => d.value > 0);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Confirm Logout', content: 'Are you sure?',
      okText: 'Logout', cancelText: 'Cancel',
      onOk() { logout(); navigate('/login'); },
    });
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Student', dataIndex: 'name', key: 'name', fixed: 'left', width: 200,
      render: (text, r) => (
        <Space>
          <Avatar icon={<UserOutlined />}
            style={{ background: `linear-gradient(135deg,${P.primary},${P.purple})`, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: P.text }}>{text || '—'}</div>
            <div style={{ fontSize: 11, color: P.textSm }}>{r.studentNumber || '—'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Branch / Program', key: 'branch', width: 150,
      render: (_, r) => (
        <div>
          <Tag color="blue" style={{ fontSize: 11 }}>{r.branch || '—'}</Tag>
          <div style={{ fontSize: 10, color: P.textSm, marginTop: 2 }}>{r.program || ''}</div>
        </div>
      ),
    },
    {
      title: 'Avg Score', dataIndex: 'averageScore', key: 'averageScore', width: 130,
      sorter: (a, b) => (a.averageScore || 0) - (b.averageScore || 0),
      render: score => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `3px solid ${scoreColor(score)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: scoreColor(score),
          }}>
            {score > 0 ? `${score}%` : 'N/A'}
          </div>
          <Progress percent={score} size="small" showInfo={false}
            strokeColor={scoreColor(score)} style={{ width: 50 }} />
        </div>
      ),
    },
    {
      title: 'Predicted', dataIndex: 'predictedScore', key: 'predictedScore', width: 110,
      sorter: (a, b) => (a.predictedScore || 0) - (b.predictedScore || 0),
      render: score => (
        <Tag icon={score > 0 ? <RiseOutlined /> : null}
          color={score >= 75 ? 'green' : score >= 60 ? 'blue' : 'orange'}
          style={{ fontWeight: 600 }}>
          {score > 0 ? `${score}%` : 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'GPA', dataIndex: 'gpa', key: 'gpa', width: 80,
      sorter: (a, b) => (a.gpa || 0) - (b.gpa || 0),
      render: gpa => (
        <strong style={{ color: gpa >= 3.5 ? P.success : gpa >= 2.5 ? P.primary : gpa >= 1.0 ? P.warning : P.error }}>
          {(gpa || 0).toFixed(2)}
        </strong>
      ),
    },
    {
      title: 'Assessments', dataIndex: 'totalAssessments', key: 'totalAssessments', width: 110,
      sorter: (a, b) => (a.totalAssessments || 0) - (b.totalAssessments || 0),
      render: n => <Badge count={n} showZero style={{ background: n > 0 ? P.purple : P.textSm }} />,
    },
    {
      title: 'Trend', dataIndex: 'trend', key: 'trend', width: 110,
      render: trend => (
        <Tag icon={<TrendIcon trend={trend} />}
          color={trend === 'improving' || trend === 'Improving' ? 'success'
            : trend === 'declining' || trend === 'Declining' ? 'error' : 'warning'}>
          {trend || 'stable'}
        </Tag>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: status => <Tag color={statusColor(status)}>{status || 'Unknown'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', fixed: 'right', width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setDetailStudent(record)}>Details</Button>
      ),
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: P.bg }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: P.textMd, fontSize: 15 }}>Loading Admin Dashboard…</div>
        <div style={{ marginTop: 8, color: P.textSm, fontSize: 12 }}>Fetching student data and analytics</div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', background: P.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, background: P.cardBg, borderRadius: 14,
        padding: '18px 24px', border: `1px solid ${P.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChartOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.text }}>Admin Dashboard</h1>
            <div style={{ color: P.textSm, fontSize: 12, marginTop: 2 }}>
              Welcome, {user?.name} · Real-time student analytics
            </div>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboardData} loading={loading}>Refresh</Button>
          <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
        </Space>
      </div>

      {/* Error banner */}
      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 20, borderRadius: 10 }}
          action={<Button size="small" onClick={fetchDashboardData}>Retry</Button>} />
      )}

      {/* No-student diagnostic */}
      {!error && students.length === 0 && !loading && (
        <Alert type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 20, borderRadius: 10 }}
          message="No student data found"
          description={
            <div>
              <p>The backend connected but returned 0 students. Possible reasons:</p>
              <ul style={{ marginLeft: 18, marginTop: 4, fontSize: 13 }}>
                <li>No students have been registered in the database yet</li>
                <li>No <code>QuizScore</code> records are linked to students</li>
                <li>The <code>studentId</code> in QuizScore doesn't match any Student <code>_id</code></li>
                <li>Check your MongoDB collections: <strong>students</strong> and <strong>quizscores</strong></li>
              </ul>
            </div>
          }
        />
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Students',    value: summary.totalStudents    || 0, icon: '👥', color: P.primary,  suffix: '',  precision: 0 },
          { title: 'Total Assessments', value: summary.totalAssessments || 0, icon: '📝', color: P.success,  suffix: '',  precision: 0 },
          { title: 'Average Score',     value: summary.averageScore     || 0, icon: '📊', color: P.warning,  suffix: '%', precision: 1 },
          { title: 'Average GPA',       value: summary.averageGPA       || 0, icon: '🎓', color: P.purple,   suffix: '',  precision: 2 },
          { title: 'Pass Rate',         value: summary.passRate         || 0, icon: '✅', color: P.cyan,     suffix: '%', precision: 1 },
        ].map((m, i) => (
          <Col xs={24} sm={12} lg={i < 2 ? 6 : 8} key={i} style={{ display: 'flex' }}>
            <Card style={{ borderRadius: 12, border: `1px solid ${P.border}`, flex: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <Statistic
                title={<span style={{ fontSize: 13, color: P.textMd }}>{m.title}</span>}
                value={m.value}
                precision={m.precision}
                suffix={m.suffix}
                prefix={<span style={{ fontSize: 18, marginRight: 4 }}>{m.icon}</span>}
                valueStyle={{ color: m.color, fontWeight: 800, fontSize: 26 }}
              />
              {i === 2 && summary.averageScore > 0 && (
                <Progress percent={Math.round(summary.averageScore)} showInfo={false}
                  strokeColor={scoreColor(summary.averageScore)} style={{ marginTop: 8 }} size="small" />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabbed Charts */}
      <Tabs defaultActiveKey="overview" style={{ marginBottom: 24 }}
        items={[
          {
            key: 'overview', label: '📈 Overview',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title={<Space><span>📈</span><span>Performance Trend (Monthly)</span></Space>}
                    style={{ borderRadius: 12, border: `1px solid ${P.border}` }}>
                    {perfTrend.filter(t => t.average > 0).length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={perfTrend}>
                          <defs>
                            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={P.primary} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={P.primary} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <RechartsTooltip contentStyle={{ borderRadius: 10 }} />
                          <Legend />
                          <Area type="monotone" dataKey="average" name="Avg Score"
                            stroke={P.primary} fill="url(#avgGrad)" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="assessments" name="Assessments"
                            stroke={P.success} strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty description="No monthly data yet — scores need date fields" style={{ padding: '40px 0' }} />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title={<Space><span>📊</span><span>Score Distribution</span></Space>}
                    style={{ borderRadius: 12, border: `1px solid ${P.border}` }}>
                    {scoreDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={scoreDistribution} cx="50%" cy="45%"
                            outerRadius={85} dataKey="value" labelLine={false}
                            label={({ percent }) => percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ''}>
                            {scoreDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <RechartsTooltip formatter={(v, n) => [`${v} students`, n]} />
                          <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty description="No score data available" style={{ padding: '40px 0' }} />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'subjects', label: '📚 Subjects',
            children: (
              <Card style={{ borderRadius: 12, border: `1px solid ${P.border}` }}>
                {subjectPerf.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, subjectPerf.length * 38)}>
                    <BarChart data={subjectPerf} layout="vertical" margin={{ left: 180, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={180}
                        tick={{ fontSize: 10 }}
                        tickFormatter={v => v.length > 32 ? v.slice(0, 32) + '…' : v} />
                      <RechartsTooltip contentStyle={{ borderRadius: 10 }} formatter={(v, n) => [`${v}%`, n]} />
                      <Legend />
                      <Bar dataKey="average" name="Avg Score %" radius={[0, 4, 4, 0]}>
                        {subjectPerf.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                      <Bar dataKey="passRate" name="Pass Rate %" fill={P.success} opacity={0.5} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No subject performance data" style={{ padding: '60px 0' }} />
                )}
              </Card>
            ),
          },
          ...(branchPerf.length > 0 ? [{
            key: 'branches', label: '🏢 Branches',
            children: (
              <Row gutter={[16, 16]}>
                {branchPerf.map((b, i) => (
                  <Col xs={24} sm={12} md={8} key={i}>
                    <Card style={{ borderRadius: 12, border: `1px solid ${P.border}` }} hoverable>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🏢 {b.branch}</div>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Statistic title="Avg Score" value={b.average} suffix="%" precision={1}
                            valueStyle={{ color: scoreColor(b.average), fontSize: 22, fontWeight: 800 }} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="Students" value={b.totalStudents}
                            valueStyle={{ color: P.purple, fontSize: 22, fontWeight: 800 }} />
                        </Col>
                      </Row>
                      <Progress percent={Math.round(b.passRate || 0)} size="small"
                        strokeColor={b.passRate >= 75 ? P.success : b.passRate >= 50 ? P.warning : P.error}
                        style={{ marginTop: 12 }}
                        format={p => `${p}% pass`} />
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          }] : []),
        ]}
      />

      {/* Top & At-Risk Students */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><span>Top 10 Students</span></Space>}
            style={{ borderRadius: 12, border: `1px solid ${P.border}` }}
          >
            {topStudents.length > 0 ? (
              <Table dataSource={topStudents} rowKey={r => r.id || r.studentNumber}
                size="small" pagination={false}
                columns={[
                  { title: '#', key: 'rank', width: 40, render: (_, __, i) => <strong style={{ color: i < 3 ? '#faad14' : P.textMd }}>{i + 1}</strong> },
                  { title: 'Name', dataIndex: 'name', key: 'name',
                    render: (text, r) => (
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} style={{ background: P.primary }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{text}</div>
                          <div style={{ fontSize: 10, color: P.textSm }}>{r.branch || ''}</div>
                        </div>
                      </Space>
                    ) },
                  { title: 'Avg', dataIndex: 'averageScore', key: 'avg',
                    render: s => <Tag color="success" style={{ fontWeight: 700 }}>{s}%</Tag> },
                  { title: 'GPA', dataIndex: 'gpa', key: 'gpa',
                    render: g => <strong style={{ color: P.primary }}>{(g || 0).toFixed(2)}</strong> },
                ]}
              />
            ) : (
              <Empty description="No students with assessments found" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Space><WarningOutlined style={{ color: P.error }} /><span>At-Risk Students</span></Space>}
            style={{ borderRadius: 12, border: `1px solid ${P.border}` }}
          >
            {atRiskStudents.length > 0 ? (
              <Table dataSource={atRiskStudents} rowKey={r => r.id || r.studentNumber}
                size="small" pagination={false}
                columns={[
                  { title: 'Name', dataIndex: 'name', key: 'name',
                    render: (text, r) => (
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} style={{ background: P.error }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{text}</div>
                          <div style={{ fontSize: 10, color: P.textSm }}>{r.branch || ''}</div>
                        </div>
                      </Space>
                    ) },
                  { title: 'Avg', dataIndex: 'averageScore', key: 'avg',
                    render: s => <Tag color="error" style={{ fontWeight: 700 }}>{s}%</Tag> },
                  { title: 'GPA', dataIndex: 'gpa', key: 'gpa',
                    render: g => <strong style={{ color: P.error }}>{(g || 0).toFixed(2)}</strong> },
                  { title: 'Predicted', dataIndex: 'predictedScore', key: 'pred',
                    render: s => <Tag color={s >= 50 ? 'orange' : 'red'}>{s > 0 ? `${s}%` : 'N/A'}</Tag> },
                ]}
              />
            ) : (
              <Empty description={students.length > 0 ? '🎉 No at-risk students!' : 'No student data'} />
            )}
          </Card>
        </Col>
      </Row>

      {/* All Students Table */}
      <Card
        title={<Space><TeamOutlined style={{ color: P.primary }} /><span>All Students ({filteredStudents.length})</span></Space>}
        style={{ borderRadius: 12, border: `1px solid ${P.border}` }}
        extra={
          <Space wrap>
            <Input
              placeholder="Search name, email, ID, branch…"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 160 }}
              options={[
                { value: 'all',           label: 'All Status' },
                { value: 'Excellent',     label: '⭐ Excellent' },
                { value: 'Good',          label: '✅ Good' },
                { value: 'Below Average', label: '⚠️ Below Average' },
                { value: 'At Risk',       label: '🔴 At Risk' },
                { value: 'No Data',       label: '— No Data' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey={r => r.id || r.studentNumber || r.name}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t} students` }}
          scroll={{ x: 1100 }}
          size="middle"
          loading={loading}
          locale={{ emptyText: <Empty description="No students match your filters" /> }}
          rowClassName={r => r.status === 'At Risk' ? 'at-risk-row' : ''}
        />
      </Card>

      {/* Student Detail Modal */}
      <Modal
        title={
          <Space>
            <Avatar icon={<UserOutlined />} style={{ background: P.primary }} />
            <span>{detailStudent?.name}</span>
            <Tag color={statusColor(detailStudent?.status)}>{detailStudent?.status}</Tag>
          </Space>
        }
        open={!!detailStudent}
        onCancel={() => setDetailStudent(null)}
        width={640}
        footer={<Button onClick={() => setDetailStudent(null)}>Close</Button>}
      >
        {detailStudent && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Student Number" span={2}>{detailStudent.studentNumber || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{detailStudent.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Branch"><Tag color="blue">{detailStudent.branch || '—'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Program">{detailStudent.program || '—'}</Descriptions.Item>
              <Descriptions.Item label="Year / Sem">{detailStudent.year || '—'} / {detailStudent.semester || '—'}</Descriptions.Item>
              <Descriptions.Item label="Average Score">
                <strong style={{ color: scoreColor(detailStudent.averageScore), fontSize: 18 }}>
                  {detailStudent.averageScore}%
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="GPA">
                <strong style={{ color: P.primary }}>{(detailStudent.gpa || 0).toFixed(2)} / 4.0</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Predicted Score">
                <Tag color={detailStudent.predictedScore >= 75 ? 'green' : detailStudent.predictedScore >= 60 ? 'blue' : 'orange'}>
                  {detailStudent.predictedScore > 0 ? `${detailStudent.predictedScore}%` : 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Assessments">
                <Badge count={detailStudent.totalAssessments} showZero style={{ background: P.purple }} />
              </Descriptions.Item>
            </Descriptions>

            {(detailStudent.subjects || []).length > 0 && (
              <>
                <Divider>Subjects</Divider>
                <Space wrap>
                  {detailStudent.subjects.map((subject, idx) => {
                    const subjectName = typeof subject === 'string' ? subject : subject.name || `Subject ${idx + 1}`;
                    const subjectScore = subject && typeof subject === 'object' ? subject.average : null;
                    return (
                      <Tag key={subjectName} color="geekblue">
                        {subjectName}{subjectScore != null ? ` (${subjectScore}%)` : ''}
                      </Tag>
                    );
                  })}
                </Space>
              </>
            )}

            <Divider>AI Recommendations</Divider>
            <List size="small" dataSource={[
              detailStudent.averageScore < 50 && `⚠️ Score ${detailStudent.averageScore}% is critically below pass threshold — urgent intervention needed`,
              detailStudent.averageScore < 75 && detailStudent.averageScore >= 50 && `📖 Score is ${detailStudent.averageScore}% — increase study hours to reach the 75% target`,
              (detailStudent.trend === 'declining' || detailStudent.trend === 'Declining') && `📉 Performance is declining — review recent assessment results immediately`,
              detailStudent.averageScore >= 75 && `✅ Performing well at ${detailStudent.averageScore}% — keep up the momentum!`,
              detailStudent.predictedScore > detailStudent.averageScore && `🔮 Predicted to improve to ${detailStudent.predictedScore}% — positive trajectory`,
              detailStudent.predictedScore < detailStudent.averageScore && detailStudent.predictedScore > 0 && `🔮 Predicted score ${detailStudent.predictedScore}% is lower — take proactive steps now`,
            ].filter(Boolean)} renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<BulbOutlined style={{ color: P.warning, fontSize: 16 }} />}
                  description={<span style={{ fontSize: 13 }}>{item}</span>}
                />
              </List.Item>
            )} />
          </>
        )}
      </Modal>

      <style>{`
        .at-risk-row td { background: #fff5f5 !important; }
        .at-risk-row:hover td { background: #fee2e2 !important; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;