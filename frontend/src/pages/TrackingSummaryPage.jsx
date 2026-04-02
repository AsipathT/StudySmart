import React, { useState, useEffect } from 'react';
import { Select, DatePicker, Spin, Modal } from 'antd';
import {
  HistoryOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  PauseCircleOutlined,
  TrophyOutlined,
  FilePdfOutlined,
  UserOutlined,
  ClearOutlined,
  BookOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  LaptopOutlined,
  RightOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import studySessionService from '../services/studySessionService';
import subjectService from '../services/subjectService';
import { useAuth } from '../hooks/useAuth';
import './TrackingSummaryPage.css';

const { RangePicker } = DatePicker;

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
const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};
const formatDur = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
const fmtDateFull = (d) => d ? new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

// ── Detail Modal ──────────────────────────────────────────────────────────────
const SessionDetailModal = ({ session, subjects, isAdmin, onClose }) => {
  if (!session) return null;

  const subj         = subjects.find(s => s.name === session.subject);
  const gradient     = getSubjectGradient(subj?.color);
  const hasWork      = (session.workedTime || 0) > 0;
  const focusRate    = hasWork && session.duration > 0
    ? Math.round((session.workedTime / session.duration) * 100) : 0;
  const breakTime    = Math.max(0, (session.duration || 0) - (session.workedTime || 0));
  const startTime    = session.startTime ? new Date(session.startTime) : null;
  const endTime      = session.endTime   ? new Date(session.endTime)   : null;

  const motivationalMsg = focusRate >= 80 ? 'Outstanding focus!'
    : focusRate >= 60 ? 'Great session!'
    : focusRate >= 30 ? 'Good effort — keep it up!'
    : 'Every session counts!';

  const totalFocusedMin = hasWork ? Math.round(session.workedTime / 60) : 0;
  const avgPerInterval  = (session.intervals > 0 && hasWork)
    ? Math.round(session.workedTime / session.intervals / 60) : 0;

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      centered
      width={660}
      closable={false}
      styles={{
        content: { background: '#0b1222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 0, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
        mask:    { backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.65)' },
      }}
    >
      {/* ── Hero Banner (mirrors stop-session summary exactly) ── */}
      <div style={{ background: gradient, borderRadius: '20px 20px 0 0', padding: '26px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -24, right: 70, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14, zIndex: 2,
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><CloseOutlined style={{ fontSize: 11 }} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircleOutlined style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Session Complete!</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.subject} · {session.unitName}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Total Time</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1.15 }}>{formatTime(session.duration)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 13, borderTop: '1px solid rgba(255,255,255,0.15)', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <ClockCircleOutlined style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>→</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            {startTime ? startTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#fff', fontWeight: 700, background: 'rgba(255,255,255,0.18)', padding: '3px 12px', borderRadius: 100 }}>
            {motivationalMsg}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '20px 24px 28px' }}>

        {/* Admin: student row */}
        {isAdmin && session.userId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, marginBottom: 14 }}>
            <UserOutlined style={{ color: '#818cf8', fontSize: 14 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{session.userId.name || 'Unknown'}</span>
            {session.userId.email && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>{session.userId.email}</span>}
          </div>
        )}

        {/* ── 4 stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockCircleOutlined style={{ color: '#60a5fa', fontSize: 13 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Total Session</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>{formatTime(session.duration)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>Wall-clock time</div>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ThunderboltOutlined style={{ color: '#34d399', fontSize: 13 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Focus Time</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>{formatTime(session.workedTime || 0)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>Active pomodoro time</div>
          </div>

          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PauseCircleOutlined style={{ color: '#fbbf24', fontSize: 13 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Break / Idle</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>{formatTime(breakTime)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>Non-focus time</div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrophyOutlined style={{ color: '#818cf8', fontSize: 13 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Focus Rate</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>{focusRate}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>
              {focusRate >= 70 ? 'Excellent' : focusRate >= 40 ? 'Good' : focusRate > 0 ? 'Can improve' : 'No pomodoro used'}
            </div>
          </div>
        </div>

        {/* ── Pomodoro Summary ── */}
        <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🍅</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pomodoro Summary</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Intervals Done', value: session.intervals || 0,                    sub: 'completed rounds',  color: '#fb7185' },
              { label: 'Duration Each',  value: '—',                                        sub: 'not stored',        color: '#f43f5e' },
              { label: 'Total Focused',  value: totalFocusedMin > 0 ? `${totalFocusedMin}m` : '—', sub: 'focused minutes', color: '#fb7185' },
              { label: 'Avg / Interval', value: avgPerInterval > 0 ? `${avgPerInterval}m` : '—',   sub: 'avg per round',   color: '#f43f5e' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 4 }}>
              <span>Focus efficiency</span><span style={{ fontWeight: 700 }}>{focusRate}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${focusRate}%`, borderRadius: 100, background: 'linear-gradient(90deg,#f43f5e,#fb7185)', boxShadow: '0 0 8px rgba(244,63,94,0.45)' }} />
            </div>
          </div>
        </div>

        {/* ── Session Details ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Session Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'Subject',          value: session.subject },
              { label: 'Unit / Module',    value: session.unitName || '—' },
              { label: 'Material Studied', value: session.materialName || 'General session' },
              { label: 'Started At',       value: startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—' },
              { label: 'Ended At',         value: endTime   ? endTime.toLocaleTimeString([],   { hour: '2-digit', minute: '2-digit', hour12: true }) : '—' },
              { label: 'Date',             value: startTime ? startTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            ].map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>{d.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
};

// ── Compact Session Tile ──────────────────────────────────────────────────────
const SessionTile = ({ session, subjects, isAdmin, onClick }) => {
  const subj      = subjects.find(s => s.name === session.subject);
  const gradient  = getSubjectGradient(subj?.color);
  const icon      = getSubjectIcon(subj?.icon);
  const hasWork   = (session.workedTime || 0) > 0;
  const focusRate = hasWork && session.duration > 0
    ? Math.round((session.workedTime / session.duration) * 100) : null;

  const rateColor = focusRate === null ? 'rgba(255,255,255,0.25)'
    : focusRate >= 70 ? '#4ade80'
    : focusRate >= 40 ? '#818cf8'
    : '#fbbf24';

  return (
    <div className="ts-compact-tile" onClick={onClick}>
      {/* Left gradient bar */}
      <div style={{ width: 4, background: gradient, borderRadius: '12px 0 0 12px', flexShrink: 0, alignSelf: 'stretch' }} />

      {/* Subject icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: gradient, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#fff',
      }}>{icon}</div>

      {/* Subject + Unit */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.3px' }}>
            {session.subject}
          </span>
          {isAdmin && session.userId?.name && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <UserOutlined style={{ fontSize: 9 }} />{session.userId.name}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
          {session.unitName || '—'}
        </div>
      </div>

      {/* Date */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{fmtDate(session.startTime)}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{fmtTime(session.startTime)}</div>
      </div>

      {/* Duration badge */}
      <div style={{
        fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#60a5fa',
        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)',
        padding: '3px 10px', borderRadius: 8, flexShrink: 0, whiteSpace: 'nowrap',
      }}>{formatDur(session.duration)}</div>

      {/* Focus rate badge */}
      <div style={{
        fontSize: 11, fontWeight: 800, color: rateColor,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${rateColor}33`,
        padding: '3px 9px', borderRadius: 8, flexShrink: 0, minWidth: 44, textAlign: 'center',
      }}>{focusRate !== null ? `${focusRate}%` : '—'}</div>

      {/* Pomodoro count */}
      {(session.intervals || 0) > 0 && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>🍅</span><span>{session.intervals}</span>
        </div>
      )}

      {/* Chevron */}
      <RightOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'color 0.15s, transform 0.15s' }} className="ts-tile-arrow" />
    </div>
  );
};

// ── TrackingSummaryPage ───────────────────────────────────────────────────────
const TrackingSummaryPage = () => {
  const { user }   = useAuth();
  const [history, setHistory]       = useState([]);
  const [subjects, setSubjects]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [usersList, setUsersList]   = useState([]);
  const [filters, setFilters]       = useState({ subject: null, userId: null, dateRange: [] });
  const [selected, setSelected]     = useState(null); // session for detail modal

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { fetchHistory(); }, [filters, user]);

  const fetchInitialData = async () => {
    try {
      const subjResp = await subjectService.getAllSubjects();
      setSubjects(subjResp.data);
      if (user.role === 'admin') {
        const { data } = await axios.get('http://localhost:5000/api/auth/users');
        setUsersList(data.data);
      }
    } catch (e) { console.error('Failed to load data'); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { subject: filters.subject, userId: filters.userId };
      if (filters.dateRange?.length === 2) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate   = filters.dateRange[1].toISOString();
      }
      const resp = user.role === 'admin'
        ? await studySessionService.getAllHistory(params)
        : await studySessionService.getHistory(user.id || user._id, params);
      setHistory(resp.data.data || resp.data);
    } catch { console.error('Failed to fetch history'); }
    finally { setLoading(false); }
  };

  // Aggregate stats
  const totalSessions  = history.length;
  const totalDuration  = history.reduce((s, h) => s + (h.duration  || 0), 0);
  const totalFocus     = history.reduce((s, h) => s + (h.workedTime || 0), 0);
  const totalPomodoros = history.reduce((s, h) => s + (h.intervals  || 0), 0);
  const avgFocusRate   = totalDuration > 0 ? Math.round((totalFocus / totalDuration) * 100) : 0;

  return (
    <div className="tracking-summary-container">

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
        }}>
          <HistoryOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Study Tracking Summary</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} recorded · click any row to see details
          </p>
        </div>
      </div>

      {/* Aggregate Stats */}
      {totalSessions > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Sessions',   value: totalSessions,             icon: <HistoryOutlined />,     color: '#818cf8', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.18)' },
            { label: 'Total Time', value: formatTime(totalDuration), icon: <ClockCircleOutlined />, color: '#60a5fa', bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.16)' },
            { label: 'Focus Time', value: formatTime(totalFocus),    icon: <ThunderboltOutlined />, color: '#34d399', bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.16)' },
            { label: 'Pomodoros',  value: totalPomodoros,            icon: <span>🍅</span>,         color: '#fb7185', bg: 'rgba(244,63,94,0.06)',   border: 'rgba(244,63,94,0.14)'  },
            { label: 'Avg Focus',  value: `${avgFocusRate}%`,        icon: <TrophyOutlined />,      color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.14)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'rgba(15,23,41,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <FilterOutlined style={{ color: '#818cf8', fontSize: 12 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filters</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 140px', minWidth: 120 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Subject</div>
            <Select style={{ width: '100%' }} placeholder="All" allowClear value={filters.subject} onChange={(v) => setFilters({ ...filters, subject: v })}>
              {subjects.map(s => <Select.Option key={s._id} value={s.name}>{s.name}</Select.Option>)}
            </Select>
          </div>
          {user.role === 'admin' && (
            <div style={{ flex: '1 1 140px', minWidth: 120 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Student</div>
              <Select style={{ width: '100%' }} placeholder="All" allowClear value={filters.userId} onChange={(v) => setFilters({ ...filters, userId: v })} showSearch optionFilterProp="children">
                {usersList.map(u => <Select.Option key={u._id} value={u._id}>{u.name}</Select.Option>)}
              </Select>
            </div>
          )}
          <div style={{ flex: '2 1 200px', minWidth: 180 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Date Range</div>
            <RangePicker style={{ width: '100%' }} onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })} />
          </div>
          <button onClick={() => setFilters({ subject: null, userId: null, dateRange: [] })} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 13px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}>
            <ClearOutlined style={{ fontSize: 10 }} /> Reset
          </button>
        </div>
      </div>

      {/* Column header */}
      {history.length > 0 && !loading && (
        <div className="ts-tile-header">
          <div style={{ width: 4, flexShrink: 0 }} />
          <div style={{ width: 32, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>Subject · Unit</div>
          <div style={{ minWidth: 72, textAlign: 'right' }}>Date</div>
          <div style={{ minWidth: 52 }}>Duration</div>
          <div style={{ minWidth: 44 }}>Focus</div>
          <div style={{ minWidth: 30 }}>Pomo</div>
          <div style={{ width: 16 }} />
        </div>
      )}

      {/* Session Tiles */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : history.length === 0 ? (
        <div style={{ background: 'rgba(15,23,41,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '56px 32px', textAlign: 'center' }}>
          <HistoryOutlined style={{ fontSize: 44, color: 'rgba(255,255,255,0.1)', marginBottom: 14 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>No sessions found</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)' }}>Complete a study session to see it here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map((session) => (
            <SessionTile
              key={session._id}
              session={session}
              subjects={subjects}
              isAdmin={user.role === 'admin'}
              onClick={() => setSelected(session)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <SessionDetailModal
          session={selected}
          subjects={subjects}
          isAdmin={user.role === 'admin'}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  );
};

export default TrackingSummaryPage;
