import React, { useState, useEffect } from 'react';
import {
  Card, Select, Button, Row, Col, Spin, Alert, Space,
  Typography, Statistic, Progress, Tag, Divider, Empty,
  List, Timeline
} from 'antd';
import {
  RocketOutlined, ReloadOutlined, BarChartOutlined,
  TrophyOutlined, BookOutlined, ClockCircleOutlined,
  RiseOutlined, FallOutlined, MinusOutlined,
  CheckCircleOutlined, CloseCircleOutlined, BulbOutlined,
  HistoryOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend
} from 'recharts';
import predictionAPI from '../services/prediction.service';

const { Title, Text } = Typography;
const { Option } = Select;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  primary:   '#2563eb',
  primaryBg: '#eff6ff',
  success:   '#059669',
  successBg: '#ecfdf5',
  warning:   '#d97706',
  warningBg: '#fffbeb',
  error:     '#dc2626',
  errorBg:   '#fef2f2',
  purple:    '#7c3aed',
  purpleBg:  '#f5f3ff',
  text:      '#1e293b',
  textMd:    '#475569',
  textSm:    '#64748b',
  border:    '#dbeafe',
  bg:        '#f0f5ff',
};

// ── All SLIIT subjects (same as UploadPage) ───────────────────────────────────
const ALL_SUBJECTS = [
  "IT1180 - Effective Academic Communication","IT1140 - Fundamentals of Computing",
  "IT1130 - Mathematics for Computing","IT1120 - Introduction to Programming",
  "IE1030 - Data Communication Networks","SE1020 - Object Oriented Programming",
  "IT1170 - Data Structures and Algorithms","IT1160 - Discrete Mathematics",
  "IT1150 - Technical Writing","SE2030 - Software Engineering",
  "IT2140 - Database Design and Development","IT2120 - Probability and Statistics",
  "IT2011 - Artficial Intelligence and Machine Learning",
  "SE2020 - Web and Mobile Technology","IT2160 - Professional Skills",
  "IT2150 - IT Project","IT2130 - Operating Systems and System Administration",
  "IT3050 - Employability Skills Development - Seminar",
  "IT3040 - IT Project Management","IT3030 - Programming Applications and Frameworks",
  "IT3020 - Database Systems","IT3010 - Network Design and Management",
  "IT3090 - Bussiness Management for IT","IT3080 - Data Science & Analytics",
  "IT3070 - Information Assurance & Security","IT3060 - Human Computer Interaction",
  "SE3040 - Application Frameworks","SE3030 - Software Architecture",
  "SE3020 - Distributed Systems",
  "SE3010 - Software Engineering Process & Quality Management",
  "SE3080 - Software Project Management",
  "SE3070 - Case Studies in Software Engineering",
  "SE3060 - Database Systems","SE3050 - User Experience Engineering",
  "IT4060 - Machine Learning","IT4020 - Modern Topics in IT",
  "IT4010 - Research Project","IT4100 - Software Quality Assurance",
  "IT4110 - Computer Systems and Network Administration",
  "IT4130 - Image Understanding & Processing",
  "IT4070 - Preparation for the Professional World",
  "IE4040 - Information Assurance and Auditing",
  "SE4020 - Mobile Application Design and Development",
  "SE4010 - Current Trends in Software Engineering",
  "SE4050 - Deep Learning","SE4040 - Enterprise Application Development",
  "SE4030 - Secure Software Development",
  "IE4060 - Robotics & Intelligent Systems",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = s => s >= 75 ? C.success : s >= 50 ? C.warning : C.error;
const scoreBg    = s => s >= 75 ? C.successBg : s >= 50 ? C.warningBg : C.errorBg;
const confidenceColor = c =>
  c === 'High' ? C.success : c === 'Medium' ? C.warning : C.error;

const GaugeArc = ({ score, size = 160 }) => {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = Math.min(score / 100, 1) * arc;
  const off  = -(circ * 0.125);
  const rot  = `rotate(135 ${cx} ${cy})`;
  const col  = scoreColor(score);
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={12}
        strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={off}
        strokeLinecap="round" transform={rot} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={12}
        strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={off}
        strokeLinecap="round" transform={rot}
        style={{ filter: `drop-shadow(0 0 6px ${col}80)`, transition: 'stroke-dasharray 0.8s' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight={800} fill={col}>{score}%</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill={C.textSm}>predicted</text>
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const PredictionPage = () => {
  const [loading,     setLoading]     = useState(false);
  const [subject,     setSubject]     = useState(null);
  const [prediction,  setPrediction]  = useState(null);
  const [history,     setHistory]     = useState([]);
  const [availSubs,   setAvailSubs]   = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error,       setError]       = useState(null);

  // ── Load subjects that have actual marks data ────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingSubs(true);
      try {
        const res = await predictionAPI.getStudentSubjects();
        if (res?.success && res.data?.length > 0) {
          setAvailSubs(res.data);
          setSubject(res.data[0]);
        } else {
          // No subjects from API — show all SLIIT subjects as fallback
          setAvailSubs([]);
        }
      } catch {
        setAvailSubs([]);
      } finally {
        setLoadingSubs(false);
      }
    })();

    // Load prediction history
    predictionAPI.getPredictionHistory()
      .then(r => { if (r?.success) setHistory(r.data || []); })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!subject) { setError('Please select a subject'); return; }
    setLoading(true);
    setError(null);
    try {
      // Try to get marks data from sessionStorage (set by UploadPage)
      let marksData = [];
      try {
        const cached = sessionStorage.getItem('analyticsScores');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            marksData = parsed.filter(r => r.subject === subject || (r.subject || '').includes(subject.split(' - ')[0]));
          }
        }
      } catch (_) {}

      const result = await predictionAPI.generatePrediction(subject, marksData);
      if (result?.success) {
        setPrediction(result.data);
        // refresh history
        const h = await predictionAPI.getPredictionHistory().catch(() => null);
        if (h?.success) setHistory(h.data || []);
      } else {
        setError(result?.message || 'Failed to generate prediction');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const pred  = prediction;
  const stats = pred?.currentStats || {};

  // Subject options: uploaded subjects first (highlighted), then all SLIIT subjects
  const uploadedSet  = new Set(availSubs);
  const subjectOpts  = [
    ...availSubs,
    ...ALL_SUBJECTS.filter(s => !uploadedSet.has(s)),
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px',
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #7c3aed 100%)',
        borderRadius: 18, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ThunderboltOutlined style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>Performance Predictor</Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              AI-powered predictions based on your uploaded marks
            </Text>
          </div>
        </div>
        <Tag style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', fontSize: 13, padding: '4px 14px', borderRadius: 20 }}>
          {availSubs.length > 0 ? `${availSubs.length} subjects with data` : 'Upload marks to get started'}
        </Tag>
      </div>

      <Row gutter={[20, 20]}>
        {/* ── Left: Controls ───────────────────────────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <Title level={5} style={{ marginTop: 0 }}>
              <RocketOutlined style={{ color: C.primary, marginRight: 8 }} />
              Generate Prediction
            </Title>

            {availSubs.length === 0 && !loadingSubs && !prediction && (
              <Alert type="warning" showIcon style={{ borderRadius: 10, marginBottom: 16 }}
                message="No marks data found"
                description="Upload your marks file first so predictions can use your real scores." />
            )}

            <Text style={{ fontSize: 12, color: C.textSm, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Subject
            </Text>
            <Select
              style={{ width: '100%', marginTop: 8, marginBottom: 16 }}
              value={subject}
              onChange={setSubject}
              placeholder="Choose a subject"
              showSearch
              loading={loadingSubs}
              filterOption={(input, option) =>
                option?.value?.toLowerCase().includes(input.toLowerCase())}
              size="large"
            >
              {availSubs.length > 0 && (
                <Select.OptGroup label="📊 Subjects with uploaded marks">
                  {availSubs.map(s => (
                    <Option key={s} value={s}>
                      <span style={{ color: C.primary, fontWeight: 600 }}>● </span>{s}
                    </Option>
                  ))}
                </Select.OptGroup>
              )}
              <Select.OptGroup label="📚 All SLIIT Subjects">
                {ALL_SUBJECTS.filter(s => !uploadedSet.has(s)).map(s => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select.OptGroup>
            </Select>

            <Button type="primary" size="large" icon={<ThunderboltOutlined />}
              onClick={handleGenerate} loading={loading} block
              style={{ borderRadius: 10, fontWeight: 700, height: 46 }}>
              {loading ? 'Analysing…' : 'Generate Prediction'}
            </Button>

            {error && (
              <Alert type="error" showIcon style={{ borderRadius: 10, marginTop: 12 }}
                message={error} closable onClose={() => setError(null)} />
            )}
          </Card>

          {/* Quick Stats */}
          <Card style={{ borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <Title level={5} style={{ marginTop: 0 }}>
              <BarChartOutlined style={{ color: C.purple, marginRight: 8 }} />
              Overview
            </Title>
            <Row gutter={[12, 12]}>
              {[
                { label: 'Subjects Tracked', value: availSubs.length, col: C.primary,  bg: C.primaryBg },
                { label: 'Predictions Made', value: history.length,   col: C.purple,   bg: C.purpleBg  },
                { label: 'High Confidence',
                  value: history.filter(h => h.confidence === 'High').length,
                  col: C.success, bg: C.successBg },
              ].map((s, i) => (
                <Col span={24} key={i}>
                  <div style={{ background: s.bg, borderRadius: 10, padding: '12px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: C.textMd, fontWeight: 500 }}>{s.label}</Text>
                    <Text style={{ fontSize: 22, fontWeight: 800, color: s.col }}>{s.value}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card style={{ borderRadius: 14, border: `1px solid ${C.border}` }}
              title={<Space><HistoryOutlined style={{ color: C.primary }} /><span>Recent Predictions</span></Space>}>
              <List size="small" dataSource={history.slice(0, 5)} renderItem={item => (
                <List.Item style={{ padding: '10px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 160 }}>
                      {item.subject?.split(' - ')[0] || item.subject}
                    </div>
                    <Tag color={confidenceColor(item.confidence) === C.success ? 'green'
                      : confidenceColor(item.confidence) === C.warning ? 'orange' : 'red'}
                      style={{ fontSize: 10, marginTop: 2 }}>
                      {item.confidence}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800,
                    color: scoreColor(item.predictedScore) }}>
                    {item.predictedScore}%
                  </div>
                </List.Item>
              )} />
            </Card>
          )}
        </Col>

        {/* ── Right: Results ───────────────────────────────────────────────── */}
        <Col xs={24} lg={16}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '80px 0',
              background: '#fff', borderRadius: 14, border: `1px solid ${C.border}` }}>
              <Spin size="large" />
              <Text style={{ marginTop: 20, color: C.textMd, fontSize: 14 }}>
                Analysing your marks data…
              </Text>
            </div>
          ) : pred ? (
            <>
              {/* ── Main prediction card ─────────────────────────────────── */}
              <Card style={{ borderRadius: 14, border: `2px solid ${scoreColor(pred.predictedScore)}30`,
                background: scoreBg(pred.predictedScore), marginBottom: 20 }}>
                <Row gutter={[24, 24]} align="middle">
                  <Col xs={24} sm={10} style={{ textAlign: 'center' }}>
                    <GaugeArc score={pred.predictedScore} size={180} />
                    <div style={{ marginTop: 8 }}>
                      <Tag style={{
                        background: confidenceColor(pred.confidence) + '20',
                        border: `1px solid ${confidenceColor(pred.confidence)}40`,
                        color: confidenceColor(pred.confidence),
                        fontWeight: 700, fontSize: 13, padding: '3px 14px', borderRadius: 20,
                      }}>
                        {pred.confidence} Confidence
                      </Tag>
                    </div>
                  </Col>
                  <Col xs={24} sm={14}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSm,
                      textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                      {pred.subject}
                    </div>
                    <Title level={3} style={{ marginTop: 0, color: C.text }}>
                      Predicted Score
                    </Title>

                    <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                      {[
                        { label: 'Current Avg',   value: `${stats.averageScore}%`,    col: scoreColor(stats.averageScore) },
                        { label: 'Latest Score',  value: `${stats.latestScore}%`,     col: scoreColor(stats.latestScore) },
                        { label: 'Highest',       value: `${stats.highestScore}%`,    col: C.success },
                        { label: 'Assessments',   value: stats.totalAssessments,      col: C.purple  },
                        { label: 'Current Grade', value: stats.currentGrade,          col: C.primary },
                        { label: 'Pred. Grade',   value: stats.predictedGrade,        col: scoreColor(pred.predictedScore) },
                      ].map((s, i) => (
                        <Col span={8} key={i}>
                          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10,
                            padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: s.col }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: C.textSm, marginTop: 2 }}>{s.label}</div>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Tag color={stats.passStatus === 'Pass' ? 'success' : 'error'}
                        icon={stats.passStatus === 'Pass' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        style={{ fontSize: 12, padding: '2px 10px' }}>
                        Currently {stats.passStatus}
                      </Tag>
                      {pred.recommendedHours > 0 && (
                        <Tag color="blue" icon={<ClockCircleOutlined />}
                          style={{ fontSize: 12, padding: '2px 10px' }}>
                          +{pred.recommendedHours}h recommended to reach 75%
                        </Tag>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* ── Factor breakdown ─────────────────────────────────────── */}
              <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={12}>
                  <Card style={{ borderRadius: 14, border: `1px solid ${C.border}`, height: '100%' }}
                    title={<Space><BarChartOutlined style={{ color: C.primary }} /><span>Score Factors</span></Space>}>
                    {[
                      { label: 'Quiz Average',    value: pred.factors?.quizAverage  || 0, max: 100, col: C.primary },
                      { label: 'Study Impact',    value: pred.factors?.studyImpact  || 0, max: 80,  col: C.success },
                      { label: 'Predicted Score', value: pred.predictedScore,              max: 100, col: scoreColor(pred.predictedScore) },
                    ].map((f, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: C.textMd, fontWeight: 500 }}>{f.label}</Text>
                          <Text style={{ fontSize: 13, fontWeight: 700, color: f.col }}>{f.value}%</Text>
                        </div>
                        <Progress percent={Math.round((f.value / f.max) * 100)}
                          strokeColor={f.col} showInfo={false} size="small" />
                      </div>
                    ))}
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card style={{ borderRadius: 14, border: `1px solid ${C.border}`, height: '100%' }}
                    title={<Space><BulbOutlined style={{ color: C.warning }} /><span>Recommendations</span></Space>}>
                    <List size="small" dataSource={[
                      pred.predictedScore < 50  && { icon: '🚨', col: C.error,   text: `Score below pass threshold — urgent revision needed for ${pred.subject?.split(' - ')[0]}` },
                      pred.predictedScore < 75  && { icon: '📖', col: C.warning, text: `Study ${pred.recommendedHours || 2}+ more hours to reach the 75% target` },
                      pred.predictedScore >= 75 && { icon: '✅', col: C.success, text: 'On track! Maintain your current study pace' },
                      pred.factors?.trend > 0   && { icon: '📈', col: C.success, text: 'Positive trend — your recent scores are improving' },
                      pred.factors?.trend < 0   && { icon: '📉', col: C.error,   text: 'Negative trend — review recent weak areas' },
                      stats.totalAssessments < 3 && { icon: '📊', col: C.primary, text: 'More assessments will improve prediction accuracy' },
                    ].filter(Boolean)} renderItem={item => (
                      <List.Item style={{ padding: '8px 0', border: 'none' }}>
                        <Space align="start">
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <Text style={{ fontSize: 12, color: C.textMd, lineHeight: 1.5 }}>{item.text}</Text>
                        </Space>
                      </List.Item>
                    )} />
                  </Card>
                </Col>
              </Row>

              {/* ── Meta info ────────────────────────────────────────────── */}
              <Card style={{ borderRadius: 14, border: `1px solid ${C.border}`,
                background: C.primaryBg }}>
                <Row gutter={[16, 8]}>
                  {[
                    { label: 'Quiz Scores Used',   value: pred.metadata?.quizScoresCount },
                    { label: 'Study Sessions',      value: pred.metadata?.studySessionsCount },
                    { label: 'Total Study Hours',   value: `${pred.metadata?.totalStudyHours || 0}h` },
                    { label: 'Data Points Used',    value: pred.dataPointsUsed },
                  ].map((m, i) => (
                    <Col xs={12} sm={6} key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: C.textSm }}>{m.label}</div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </>
          ) : (
            /* ── Empty / no prediction yet ─────────────────────────────── */
            <Card style={{ borderRadius: 14, border: `1px solid ${C.border}`,
              background: '#fff', textAlign: 'center', padding: '60px 24px' }}>
              <ThunderboltOutlined style={{ fontSize: 56, color: C.primary, opacity: 0.3 }} />
              <Title level={4} style={{ marginTop: 20, color: C.text }}>
                Ready to Predict
              </Title>
              <Text style={{ color: C.textMd, fontSize: 14, display: 'block', marginBottom: 24 }}>
                {availSubs.length > 0
                  ? `Select one of your ${availSubs.length} uploaded subject(s) and click Generate.`
                  : 'Upload your marks file first, then come back here to generate predictions.'}
              </Text>
              {availSubs.length === 0 && (
                <Button type="primary" href="/upload" style={{ borderRadius: 10, fontWeight: 600 }}>
                  Go to Upload
                </Button>
              )}

              {/* How it works */}
              <Divider style={{ margin: '32px 0 24px' }}>How It Works</Divider>
              <Row gutter={[16, 16]} justify="center">
                {[
                  { icon: '📤', step: '1', title: 'Upload Marks',      desc: 'Upload your CSV/Excel marks file' },
                  { icon: '🧮', step: '2', title: 'Analyse Patterns',  desc: 'AI analyses your score history & trends' },
                  { icon: '🎯', step: '3', title: 'Get Prediction',    desc: 'See predicted score + personalised tips' },
                ].map((s, i) => (
                  <Col xs={24} sm={8} key={i}>
                    <div style={{ background: C.bg, borderRadius: 12, padding: '20px 16px',
                      border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.title}</div>
                      <Text style={{ fontSize: 12, color: C.textSm }}>{s.desc}</Text>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PredictionPage;