import React, { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  FilePdfOutlined,
  FireOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  GlobalOutlined,
  LaptopOutlined,
  ReloadOutlined,
  RiseOutlined,
  MinusCircleOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useSessionTheme } from '../context/SessionThemeContext';
import subjectService from '../services/subjectService';
import studySessionService from '../services/studySessionService';
import quizService from '../services/quizService';
import './MaterialMasteryPage.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
const HEX_TO_GRADIENT = {
  '#3b82f6': 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  '#ef4444': 'linear-gradient(135deg,#ef4444,#b91c1c)',
  '#10b981': 'linear-gradient(135deg,#10b981,#059669)',
  '#f59e0b': 'linear-gradient(135deg,#f97316,#ea580c)',
  '#8b5cf6': 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  '#06b6d4': 'linear-gradient(135deg,#06b6d4,#0284c7)',
  '#374151': 'linear-gradient(135deg,#475569,#1e293b)',
  '#ec4899': 'linear-gradient(135deg,#ec4899,#db2777)',
  '#14b8a6': 'linear-gradient(135deg,#14b8a6,#0f766e)',
  '#f97316': 'linear-gradient(135deg,#f97316,#db2777)',
};
const getSubjectGradient = (color) => {
  if (!color) return 'linear-gradient(135deg,#6366f1,#4f46e5)';
  if (color.includes('gradient')) return color;
  return HEX_TO_GRADIENT[color.toLowerCase()] || 'linear-gradient(135deg,#6366f1,#4f46e5)';
};
const getSubjectIcon = (iconName) => {
  switch (iconName) {
    case 'math': case 'Calculator': return <CalculatorOutlined />;
    case 'science': case 'Atom':    return <ExperimentOutlined />;
    case 'history': case 'History': return <HistoryOutlined />;
    case 'language': case 'Globe':  return <GlobalOutlined />;
    case 'Laptop':                  return <LaptopOutlined />;
    default:                        return <BookOutlined />;
  }
};
const formatDur = (s) => {
  if (!s) return '0m';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Mastery helpers ───────────────────────────────────────────────────────────
const getMasteryConfig = (score) => {
  if (score === 0)  return { label: 'Not Started', color: '#64748b', trackColor: 'rgba(100,116,139,0.15)', barColor: '#475569', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.18)' };
  if (score < 40)   return { label: 'Exploring',   color: '#f87171', trackColor: 'rgba(248,113,113,0.12)', barColor: '#ef4444', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)'  };
  if (score < 70)   return { label: 'Learning',    color: '#fbbf24', trackColor: 'rgba(251,191,36,0.12)',  barColor: '#f59e0b', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'   };
  if (score < 90)   return { label: 'Proficient',  color: '#60a5fa', trackColor: 'rgba(96,165,250,0.12)',  barColor: '#3b82f6', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'   };
  return              { label: 'Mastered',    color: '#4ade80', trackColor: 'rgba(74,222,128,0.12)',  barColor: '#22c55e', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'   };
};

const computeMastery = (material, matSessions, quizAttempts) => {
  if (matSessions.length === 0) return 0;

  // Time score: 0–35 pts (15 min of focused study = full score)
  const totalFocusSec = matSessions.reduce((s, sess) => s + (sess.workedTime || 0), 0);
  const timeScore = Math.min(totalFocusSec / (15 * 60), 1) * 35;

  // Pages score: 0–40 pts (best pages-completion % across sessions)
  const withPages = matSessions.filter(s => (s.totalPages || 0) > 0);
  const bestPagePct = withPages.length
    ? Math.max(...withPages.map(s => Math.min((s.pagesCompleted || 0) / s.totalPages, 1)))
    : 0;
  const pagesScore = bestPagePct * 40;

  // Quiz score: 0–25 pts (best quiz score %)
  const matName = (material.name || '').toLowerCase();
  const matQuizzes = quizAttempts.filter(a => {
    const mn = (a.quizId?.materialName ?? a.materialName ?? '').toLowerCase();
    return mn === matName;
  });
  const bestQuizPct = matQuizzes.length
    ? Math.max(...matQuizzes.map(a => (a.score / (a.totalQuestions || 1))))
    : 0;
  const quizScore = bestQuizPct * 25;

  return Math.min(Math.round(timeScore + pagesScore + quizScore), 100);
};

// ── Heatmap intensity ─────────────────────────────────────────────────────────
const heatColor = (min) => {
  if (min === 0)   return 'rgba(255,255,255,0.04)';
  if (min < 15)    return 'rgba(99,102,241,0.25)';
  if (min < 30)    return 'rgba(99,102,241,0.45)';
  if (min < 60)    return 'rgba(99,102,241,0.65)';
  return                  'rgba(99,102,241,0.9)';
};

// ── MiniRing: small SVG progress ring ─────────────────────────────────────────
const MiniRing = ({ pct, color, size = 44 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
      />
    </svg>
  );
};

// ── MaterialMasteryPage ───────────────────────────────────────────────────────
const MaterialMasteryPage = () => {
  const { user } = useAuth();
  const { isDark } = useSessionTheme();
  const t = {
    dim:       isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.45)',
    veryfaint: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
  };
  const [subjects,    setSubjects]    = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState({});

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [subjR, sessR, quizR] = await Promise.all([
        subjectService.getAllSubjects(),
        studySessionService.getHistory(user.id || user._id),
        quizService.getHistory(),
      ]);
      const subjList = subjR.data || [];
      const sessList = sessR.data?.data ?? sessR.data ?? [];
      const quizList = quizR.data?.data ?? quizR.data ?? [];

      setSubjects(subjList);
      setSessions(Array.isArray(sessList) ? sessList : []);
      setQuizHistory(Array.isArray(quizList) ? quizList : []);

      // Start all subjects expanded
      const exp = {};
      subjList.forEach(s => { exp[s._id] = true; });
      setExpanded(exp);
    } catch {
      message.error('Failed to load mastery data');
    } finally {
      setLoading(false);
    }
  };

  // ── Build enriched material list ──
  const allMaterials = [];
  subjects.forEach(subj => {
    (subj.materials || []).forEach(mat => {
      allMaterials.push({ ...mat, subjectId: subj._id, subjectName: subj.name, subjectColor: subj.color, subjectIcon: subj.icon, unitName: null });
    });
    (subj.units || []).forEach(unit => {
      (unit.materials || []).forEach(mat => {
        allMaterials.push({ ...mat, subjectId: subj._id, subjectName: subj.name, subjectColor: subj.color, subjectIcon: subj.icon, unitName: unit.name });
      });
    });
  });

  const enriched = allMaterials.map(mat => {
    const matSessions = sessions.filter(s =>
      (s.materialName || '').toLowerCase() === (mat.name || '').toLowerCase()
    );
    const mastery = computeMastery(mat, matSessions, quizHistory);
    const cfg     = getMasteryConfig(mastery);

    const totalStudySec = matSessions.reduce((s, ss) => s + (ss.duration    || 0), 0);
    const totalFocusSec = matSessions.reduce((s, ss) => s + (ss.workedTime  || 0), 0);

    const withPages = matSessions.filter(s => (s.totalPages || 0) > 0);
    const bestPages = withPages.length
      ? Math.round(Math.max(...withPages.map(s => Math.min((s.pagesCompleted || 0) / s.totalPages, 1))) * 100)
      : null;

    const matName   = (mat.name || '').toLowerCase();
    const matQuizzes = quizHistory.filter(a => (a.quizId?.materialName ?? a.materialName ?? '').toLowerCase() === matName);
    const bestQuiz  = matQuizzes.length
      ? Math.max(...matQuizzes.map(a => Math.round((a.score / (a.totalQuestions || 1)) * 100)))
      : null;

    const lastSession = matSessions.length
      ? matSessions.reduce((latest, s) => new Date(s.endTime) > new Date(latest.endTime) ? s : latest)
      : null;

    return { ...mat, mastery, cfg, sessionCount: matSessions.length, totalStudySec, totalFocusSec, bestPages, bestQuiz, lastSession };
  });

  // ── Stats ──
  const total      = enriched.length;
  const mastered   = enriched.filter(m => m.mastery >= 90).length;
  const inProgress = enriched.filter(m => m.mastery > 0 && m.mastery < 90).length;
  const notStarted = enriched.filter(m => m.mastery === 0).length;
  const avgMastery = total > 0 ? Math.round(enriched.reduce((s, m) => s + m.mastery, 0) / total) : 0;

  // ── Needs attention ──
  const needsAttention = enriched.filter(m => m.mastery < 40).slice(0, 5);

  // ── Heatmap (last 28 days) ──
  const heatmap = (() => {
    const days = [];
    const now  = new Date();
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr     = d.toDateString();
      const daySessions = sessions.filter(s => s.startTime && new Date(s.startTime).toDateString() === dayStr);
      const totalMin   = daySessions.reduce((s, ss) => s + Math.round((ss.duration || 0) / 60), 0);
      days.push({ date: d, dayName: DAY_NAMES[d.getDay()], totalMin, count: daySessions.length });
    }
    return days;
  })();

  // ── Subject sections ──
  const subjectSections = subjects.map(subj => {
    const mats       = enriched.filter(m => m.subjectId === subj._id);
    const subjAvg    = mats.length ? Math.round(mats.reduce((s, m) => s + m.mastery, 0) / mats.length) : 0;
    return { ...subj, enrichedMaterials: mats, avgMastery: subjAvg };
  }).filter(s => s.enrichedMaterials.length > 0);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div className={`mastery-page${isDark ? '' : ' light-theme'}`}>

      {/* ── Static background ── */}
      <div className="mastery-bg" aria-hidden="true">
        <div className="mastery-bg-glow mastery-bg-glow-1" />
        <div className="mastery-bg-glow mastery-bg-glow-2" />
        <div className="mastery-bg-glow mastery-bg-glow-3" />
        <div className="mastery-bg-dots" />
        <div className="mastery-bg-shape mastery-bg-shape-1" />
        <div className="mastery-bg-shape mastery-bg-shape-2" />
        <div className="mastery-bg-hex mastery-bg-hex-1">⬡</div>
        <div className="mastery-bg-hex mastery-bg-hex-2">◈</div>
        <div className="mastery-bg-hex mastery-bg-hex-3">∑</div>
      </div>

      <div className="mastery-content">

        {/* ── Header ── */}
        <div className="mastery-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="mastery-header-icon">
              <RiseOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <h1 className="mastery-title">Material Mastery</h1>
              <p className="mastery-subtitle">Your learning intelligence — how well you know each material</p>
            </div>
          </div>
          <button className="mastery-refresh-btn" onClick={loadAll}>
            <ReloadOutlined style={{ fontSize: 13 }} /> Refresh
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="mastery-stats-row">
          {[
            { label: 'Total Materials', value: total,      color: '#818cf8', icon: <BookOutlined />,          stat: 'total'       },
            { label: 'Mastered',        value: mastered,   color: '#4ade80', icon: <TrophyOutlined />,         stat: 'mastered'    },
            { label: 'In Progress',     value: inProgress, color: '#fbbf24', icon: <FireOutlined />,           stat: 'in-progress' },
            { label: 'Not Started',     value: notStarted, color: '#f87171', icon: <MinusCircleOutlined />,    stat: 'not-started' },
            { label: 'Avg Mastery',     value: `${avgMastery}%`, color: '#60a5fa', icon: <ThunderboltOutlined />, stat: 'avg'      },
          ].map(s => (
            <div key={s.label} className="mastery-stat-card" data-stat={s.stat} style={{ '--stat-color': s.color }}>
              <div className="mastery-stat-icon">{s.icon}</div>
              <div className="mastery-stat-value">{s.value}</div>
              <div className="mastery-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Needs Attention ── */}
        {needsAttention.length > 0 && (
          <div className="mastery-attention-card">
            <div className="mastery-attention-header">
              <WarningOutlined style={{ color: '#fbbf24', fontSize: 14 }} />
              <span>Needs Attention</span>
              <span className="mastery-attention-count">{needsAttention.length} material{needsAttention.length > 1 ? 's' : ''}</span>
            </div>
            <div className="mastery-attention-list">
              {needsAttention.map((m, i) => (
                <div key={i} className="mastery-attention-pill" style={{ '--pill-color': m.cfg.color, '--pill-bg': m.cfg.bg, '--pill-border': m.cfg.border }}>
                  <FilePdfOutlined style={{ fontSize: 11 }} />
                  <span>{m.name}</span>
                  <span className="mastery-attention-pct">{m.mastery}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Study Heatmap ── */}
        <div className="mastery-card mastery-heatmap-card">
          <div className="mastery-card-header">
            <ClockCircleOutlined style={{ color: '#818cf8' }} />
            <span>Study Activity — Last 28 Days</span>
          </div>
          <div className="mastery-heatmap-grid">
            {heatmap.map((day, i) => (
              <div
                key={i}
                className="mastery-heat-cell"
                style={{ background: heatColor(day.totalMin) }}
                title={`${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${day.totalMin}m studied (${day.count} session${day.count !== 1 ? 's' : ''})`}
              >
                {day.count > 0 && (
                  <span className="mastery-heat-count">{day.count}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mastery-heatmap-legend">
            <span style={{ color: t.dim, fontSize: 11 }}>Less</span>
            {[0, 14, 29, 59, 60].map((min, i) => (
              <div key={i} className="mastery-legend-cell" style={{ background: heatColor(min + 1) }} />
            ))}
            <span style={{ color: t.dim, fontSize: 11 }}>More</span>
          </div>
        </div>

        {/* ── Subject Sections ── */}
        {subjectSections.length === 0 ? (
          <div className="mastery-empty">
            <BookOutlined style={{ fontSize: 52, marginBottom: 16, display: 'block' }} />
            <p style={{ fontSize: 16, margin: 0 }}>No materials found.</p>
            <p style={{ fontSize: 13, marginTop: 6, color: t.veryfaint }}>Add materials to your subjects to start tracking mastery.</p>
          </div>
        ) : (
          subjectSections.map(subj => {
            const gradient = getSubjectGradient(subj.color);
            const isOpen   = expanded[subj._id] !== false;
            const subjCfg  = getMasteryConfig(subj.avgMastery);

            return (
              <div key={subj._id} className="mastery-subject-section">
                {/* Subject header */}
                <button
                  className="mastery-subject-header"
                  style={{ '--subj-gradient': gradient }}
                  onClick={() => toggleExpand(subj._id)}
                >
                  <div className="mastery-subj-left">
                    <div className="mastery-subj-icon-wrap">
                      {getSubjectIcon(subj.icon)}
                    </div>
                    <div>
                      <div className="mastery-subj-name">{subj.name}</div>
                      <div className="mastery-subj-meta">
                        {subj.enrichedMaterials.length} material{subj.enrichedMaterials.length !== 1 ? 's' : ''}
                        <span className="mastery-dot" />
                        {subj.enrichedMaterials.filter(m => m.mastery >= 90).length} mastered
                      </div>
                    </div>
                  </div>
                  <div className="mastery-subj-right">
                    <div className="mastery-subj-ring">
                      <MiniRing pct={subj.avgMastery} color={subjCfg.color} size={44} />
                      <div className="mastery-subj-ring-label">
                        <span style={{ fontSize: 10, fontWeight: 900, color: subjCfg.color }}>{subj.avgMastery}%</span>
                      </div>
                    </div>
                    <div className="mastery-subj-chevron">
                      {isOpen ? <DownOutlined style={{ fontSize: 11 }} /> : <RightOutlined style={{ fontSize: 11 }} />}
                    </div>
                  </div>
                </button>

                {/* Materials list */}
                {isOpen && (
                  <div className="mastery-materials-list">
                    {subj.enrichedMaterials.map((mat, mi) => {
                      const cfg = mat.cfg;
                      return (
                        <div key={mi} className="mastery-mat-row">
                          {/* PDF icon */}
                          <div className="mastery-mat-icon">
                            <FilePdfOutlined style={{ color: '#f87171', fontSize: 16 }} />
                          </div>

                          {/* Name + meta */}
                          <div className="mastery-mat-info">
                            <div className="mastery-mat-name">{mat.name}</div>
                            {mat.unitName && (
                              <div className="mastery-mat-unit">{mat.unitName}</div>
                            )}

                            {/* Mastery bar */}
                            <div className="mastery-bar-track" style={{ background: cfg.trackColor }}>
                              <div
                                className="mastery-bar-fill"
                                style={{ width: `${mat.mastery}%`, background: cfg.barColor }}
                              />
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="mastery-mat-badges">
                            {mat.sessionCount > 0 && (
                              <span className="mastery-badge mastery-badge-blue">
                                <ClockCircleOutlined style={{ fontSize: 9 }} />
                                {formatDur(mat.totalStudySec)}
                              </span>
                            )}
                            {mat.bestPages !== null && (
                              <span className="mastery-badge mastery-badge-indigo">
                                📄 {mat.bestPages}%
                              </span>
                            )}
                            {mat.bestQuiz !== null && (
                              <span className="mastery-badge mastery-badge-amber">
                                <TrophyOutlined style={{ fontSize: 9 }} />
                                Quiz {mat.bestQuiz}%
                              </span>
                            )}
                          </div>

                          {/* Status badge + score */}
                          <div className="mastery-mat-status">
                            <div style={{
                              fontSize: 13, fontWeight: 900, color: cfg.color,
                              fontFamily: 'monospace', lineHeight: 1,
                            }}>{mat.mastery}%</div>
                            <span className="mastery-status-badge" style={{ '--sc': cfg.color, '--sb': cfg.bg, '--sbo': cfg.border }}>
                              {mat.mastery >= 90
                                ? <><CheckCircleOutlined style={{ fontSize: 9 }} /> {cfg.label}</>
                                : cfg.label
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* ── Score breakdown legend ── */}
        <div className="mastery-card mastery-legend-card">
          <div className="mastery-card-header">
            <TrophyOutlined style={{ color: '#fbbf24' }} />
            <span>How Mastery Score is Calculated</span>
          </div>
          <div className="mastery-score-breakdown">
            {[
              { pts: '35 pts', label: 'Focus Time',   desc: '15+ minutes of focused study = full score', color: '#60a5fa', icon: <ThunderboltOutlined /> },
              { pts: '40 pts', label: 'Pages Read',   desc: 'Best pages-completion % across all sessions', color: '#a78bfa', icon: <FilePdfOutlined /> },
              { pts: '25 pts', label: 'Quiz Score',   desc: 'Best quiz attempt score for this material', color: '#fbbf24', icon: <TrophyOutlined /> },
            ].map(b => (
              <div key={b.label} className="mastery-breakdown-item" style={{ '--bc': b.color }}>
                <div className="mastery-breakdown-icon">{b.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="mastery-breakdown-label">{b.label}</div>
                  <div className="mastery-breakdown-desc">{b.desc}</div>
                </div>
                <div className="mastery-breakdown-pts">{b.pts}</div>
              </div>
            ))}
          </div>
          <div className="mastery-status-legend">
            {[
              { score: '0',      label: 'Not Started', color: '#64748b' },
              { score: '1–39',   label: 'Exploring',   color: '#f87171' },
              { score: '40–69',  label: 'Learning',    color: '#fbbf24' },
              { score: '70–89',  label: 'Proficient',  color: '#60a5fa' },
              { score: '90–100', label: 'Mastered',    color: '#4ade80' },
            ].map(s => (
              <div key={s.label} className="mastery-legend-pill" style={{ '--lc': s.color }}>
                <div className="mastery-legend-dot" />
                <span className="mastery-legend-range">{s.score}</span>
                <span className="mastery-legend-name">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MaterialMasteryPage;
