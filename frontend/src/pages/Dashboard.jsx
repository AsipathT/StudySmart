import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import analyticsService from '../services/analytics.service';
import profileService from '../services/profile.service';
import './Dashboard.css';

/* ─────────────────────────────────────────────────────────────────────────────
   COLOUR PALETTE
───────────────────────────────────────────────────────────────────────────── */
const P = {
  blue:     '#2563eb',
  blueBg:   '#eff6ff',
  blueLt:   '#dbeafe',
  indigo:   '#4f46e5',
  green:    '#059669',
  greenBg:  '#ecfdf5',
  amber:    '#d97706',
  amberBg:  '#fffbeb',
  red:      '#dc2626',
  redBg:    '#fef2f2',
  purple:   '#7c3aed',
  purpleBg: '#f5f3ff',
  slate:    '#0f172a',
  slateMd:  '#334155',
  slateSm:  '#64748b',
  slateXs:  '#94a3b8',
  border:   '#e2e8f0',
  bg:       '#f8fafc',
  surface:  '#ffffff',
};

const scoreColor = s => s >= 75 ? P.green : s >= 55 ? P.amber : P.red;

const riskCfg = {
  Low:    { color: P.green,  bg: '#ecfdf5', border: '#a7f3d0', label: 'Low Risk',    icon: '✅' },
  Medium: { color: P.amber,  bg: '#fffbeb', border: '#fde68a', label: 'Medium Risk', icon: '⚠️' },
  High:   { color: P.red,    bg: '#fef2f2', border: '#fecaca', label: 'High Risk',   icon: '🚨' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   GPA / GRADE HELPERS
───────────────────────────────────────────────────────────────────────────── */
function scoreToGPA(s) {
  if (s >= 85) return 4.0;
  if (s >= 75) return 3.7;
  if (s >= 70) return 3.3;
  if (s >= 65) return 3.0;
  if (s >= 60) return 2.7;
  if (s >= 55) return 2.3;
  if (s >= 50) return 2.0;
  if (s >= 40) return 1.7;
  return 0.0;
}
function getGrade(s) {
  if (s >= 85) return 'A+';
  if (s >= 75) return 'A';
  if (s >= 70) return 'B+';
  if (s >= 65) return 'B';
  if (s >= 60) return 'C+';
  if (s >= 55) return 'C';
  if (s >= 50) return 'D';
  return 'F';
}
function normalizeRisk(value) {
  if (!value && value !== 0) return 'Medium';
  const norm = String(value).trim().toLowerCase();
  if (norm === 'low') return 'Low';
  if (norm === 'medium') return 'Medium';
  if (norm === 'high') return 'High';
  return 'Medium';
}

function riskLevelFromGpa(gpa) {
  if (gpa >= 3.3) return 'Low';
  if (gpa >= 2.2) return 'Medium';
  return 'High';
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG ARC HELPERS (GPA Gauge)
───────────────────────────────────────────────────────────────────────────── */
function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arc(cx, cy, r, s, e) {
  const S = polar(cx, cy, r, s), E = polar(cx, cy, r, e);
  const big = e - s > 180 ? 1 : 0;
  return `M${S.x.toFixed(1)},${S.y.toFixed(1)} A${r},${r} 0 ${big},1 ${E.x.toFixed(1)},${E.y.toFixed(1)}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MINI COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
const Chip = ({ label, color, bg, border, size = 'md' }) => (
  <span style={{
    fontSize: size === 'sm' ? 10 : 11,
    fontWeight: 700,
    padding: size === 'sm' ? '2px 8px' : '3px 11px',
    borderRadius: 20,
    background: bg,
    border: `1px solid ${border}`,
    color,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }}>{label}</span>
);

/* KPI Card */
const KpiCard = ({ icon, label, value, sub, delta, deltaUp, color, accent }) => (
  <div className="db-kpi" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
    <div className="db-kpi__icon" style={accent ? { background: `${accent}18` } : {}}>
      {icon}
    </div>
    <div className="db-kpi__label">{label}</div>
    <div className="db-kpi__value" style={{ color: color || P.slate }}>{value}</div>
    <div className="db-kpi__footer">
      {delta != null && (
        <span className={`db-kpi__delta ${deltaUp ? 'up' : 'down'}`}>
          {deltaUp ? '▲' : '▼'} {delta}
        </span>
      )}
      {sub && <span className="db-kpi__sub">{sub}</span>}
    </div>
  </div>
);

/* Subject Card */
const SubjectCard = ({ s, delay = 0 }) => {
  const col = scoreColor(s.score);
  return (
    <div className="db-sub" style={{
      borderColor: `${col}35`,
      animationDelay: `${delay}ms`,
      color: col,
    }}>
      <div className="db-sub__name" title={s.name}>{s.name}</div>
      <div className="db-sub__score">{s.score}%</div>
      <div className="db-sub__grade" style={{ color: P.slateSm }}>{s.grade}</div>
      <div className="db-sub__bar">
        <div style={{ width: `${s.score}%`, background: `linear-gradient(90deg, ${col}, ${col}bb)` }} />
      </div>
      <div className="db-sub__gpa">GPA {s.gpa.toFixed(1)}</div>
      <span className={`db-sub__status ${s.pass ? 'pass' : 'fail'}`}>
        {s.pass ? '✓ Pass' : '✗ Fail'}
      </span>
    </div>
  );
};

/* Section Header */
const SectionHeader = ({ icon, title, badge, extra }) => (
  <div className="db-section-header">
    <span style={{ fontSize: 18 }}>{icon}</span>
    <h2 className="db-section-title">{title}</h2>
    {badge && <span className="db-section-badge">{badge}</span>}
    <div className="db-section-line" />
    {extra}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   GPA GAUGE
───────────────────────────────────────────────────────────────────────────── */
const GpaGauge = ({ gpa, risk }) => {
  const cx = 120, cy = 108, R = 78, sw = 13;
  const ang = -180 + Math.min(Math.max(gpa / 4.0, 0), 1) * 180;
  const tip = polar(cx, cy, R - 12, ang);
  const rc = riskCfg[risk] || riskCfg.Medium;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={240} height={132} style={{ overflow: 'visible' }}>
        {/* track zones */}
        <path d={arc(cx, cy, R, -180, -120)} fill="none" stroke="#fecaca" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(cx, cy, R, -120, -60)}  fill="none" stroke="#fde68a" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(cx, cy, R, -60, 0)}     fill="none" stroke="#a7f3d0" strokeWidth={sw} strokeLinecap="round" />
        {/* glow track */}
        <path d={arc(cx, cy, R, -180, ang)}
          fill="none" stroke={rc.color} strokeWidth={sw} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${rc.color}70)` }} />
        {/* needle */}
        <line x1={cx} y1={cy} x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)}
          stroke={P.slateMd} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill={P.slateMd} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
        {/* tick labels */}
        {[{ l: '0', d: -180 }, { l: '2.0', d: -90 }, { l: '4.0', d: 0 }].map(({ l, d }) => {
          const p = polar(cx, cy, R + 20, d);
          return (
            <text key={l} x={p.x.toFixed(1)} y={p.y.toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fill={P.slateSm} fontSize={10} fontFamily="'JetBrains Mono',monospace">{l}</text>
          );
        })}
        {/* GPA value */}
        <text x={cx} y={cy + 22} textAnchor="middle" fill={P.slate} fontSize={26} fontWeight={900}
          fontFamily="'Plus Jakarta Sans',system-ui,sans-serif">{gpa.toFixed(2)}</text>
        <text x={cx} y={cy + 40} textAnchor="middle" fill={P.slateSm} fontSize={11}
          fontFamily="'Plus Jakarta Sans',system-ui,sans-serif"></text>
      </svg>

      {/* risk chips */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        {['Low', 'Medium', 'High'].map(r => {
          const active = r === risk, c = riskCfg[r];
          return (
            <Chip key={r} label={r} color={active ? c.color : P.slateSm}
              bg={active ? c.bg : 'transparent'} border={active ? c.border : P.border} />
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   SEMESTER BAR CHART
───────────────────────────────────────────────────────────────────────────── */
const SemBars = ({ data }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
    {data.map((d, i) => {
      const pct = (d.gpa / 4.0) * 100;
      const isLast = i === data.length - 1;
      return (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max(pct, 4)}%`,
              minHeight: 6,
              borderRadius: '6px 6px 0 0',
              background: isLast
                ? `linear-gradient(180deg, ${P.blue}, #60a5fa)`
                : `linear-gradient(180deg, #cbd5e1, #e2e8f0)`,
              boxShadow: isLast ? `0 -4px 16px ${P.blue}50` : 'none',
              transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
            }}>
              {isLast && (
                <div style={{
                  position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 10, fontWeight: 700, color: P.blue, fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                }}>{d.gpa.toFixed(2)}</div>
              )}
            </div>
          </div>
          {!isLast && (
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: P.slateXs }}>{d.gpa.toFixed(1)}</span>
          )}
          <span style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap' }}>{d.sem}</span>
        </div>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   EFFICIENCY DIAL
───────────────────────────────────────────────────────────────────────────── */
const EffDial = ({ score }) => {
  const r = 42, cx = 52, cy = 52, circ = 2 * Math.PI * r;
  const arc2 = circ * 0.75, fill = (score / 100) * arc2;
  const col = score >= 70 ? P.green : score >= 45 ? P.amber : P.red;
  const rot = `rotate(135 ${cx} ${cy})`, off = -(circ * 0.125);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
      <div style={{ position: 'relative', width: 104, height: 104 }}>
        <svg width={104} height={104}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.border} strokeWidth={10}
            strokeDasharray={`${arc2} ${circ - arc2}`} strokeDashoffset={off}
            strokeLinecap="round" transform={rot} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={10}
            strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={off}
            strokeLinecap="round" transform={rot}
            style={{ filter: `drop-shadow(0 0 6px ${col}80)`, transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: col, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: P.slateSm, fontFamily: 'monospace' }}>/ 100</div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   GRADE DISTRIBUTION
───────────────────────────────────────────────────────────────────────────── */
const GradeDist = ({ dist }) => {
  const entries = Object.entries(dist);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const colors = { A: P.green, B: P.blue, C: P.amber, D: '#f59e0b', F: P.red };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.filter(([, v]) => v > 0).map(([g, v]) => (
        <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 7,
            background: `${colors[g] || P.slateSm}18`,
            border: `1.5px solid ${colors[g] || P.slateSm}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: colors[g] || P.slateSm, flexShrink: 0,
          }}>{g}</span>
          <div style={{ flex: 1, height: 8, background: P.bg, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${(v / total) * 100}%`, height: '100%',
              background: `linear-gradient(90deg, ${colors[g] || P.border}, ${colors[g] || P.border}bb)`,
              borderRadius: 4, transition: 'width 0.7s ease',
            }} />
          </div>
          <span style={{ width: 22, fontSize: 11, color: P.slateSm, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{v}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   PERFORMANCE TREND CHART
───────────────────────────────────────────────────────────────────────────── */
const TrendChart = ({ data }) => {
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '36px 20px', color: P.slateSm, fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
      Upload marks to see your performance trend
    </div>
  );
  if (data.length === 1) {
    const val = data[0]?.average ?? data[0]?.score ?? 0;
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', color: P.slateSm, fontSize: 13 }}>
        One data point: {data[0]?.month || data[0]?.sem || ''} — <strong>{val}%</strong>. Add more marks to see the trend.
      </div>
    );
  }

  const W = 500, H = 130, padL = 36, padR = 16, padT = 20, padB = 32;
  const iW = W - padL - padR, iH = H - padT - padB;
  const vals = data.map(d => d.average || d.score || 0);
  const toX = i => padL + (i / (data.length - 1)) * iW;
  const toY = v => padT + iH - ((v / 100) * iH);
  const pts = vals.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const area = `M${toX(0).toFixed(1)},${toY(vals[0]).toFixed(1)} ` +
    vals.map((v, i) => `L${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ') +
    ` L${toX(vals.length - 1).toFixed(1)},${(padT + iH).toFixed(1)} L${padL},${(padT + iH).toFixed(1)} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="trendGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.blue} stopOpacity={0.22} />
          <stop offset="100%" stopColor={P.blue} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      {/* horizontal grid lines */}
      {[25, 50, 75].map(v => (
        <line key={v} x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)}
          stroke={P.border} strokeWidth={1} strokeDasharray="3 4" opacity={0.7} />
      ))}
      {/* target 75% */}
      <line x1={padL} y1={toY(75)} x2={W - padR} y2={toY(75)}
        stroke={P.red} strokeDasharray="5 4" strokeWidth={1.2} opacity={0.55} />
      <text x={W - padR + 3} y={toY(75)} fill={P.red} fontSize={9} dominantBaseline="middle">75%</text>
      {/* area fill */}
      <path d={area} fill="url(#trendGrad2)" />
      {/* line */}
      <polyline points={pts} fill="none" stroke={P.blue} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      {/* dots */}
      {vals.map((v, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(v)} r={5} fill="white" stroke={P.blue} strokeWidth={2} />
          <circle cx={toX(i)} cy={toY(v)} r={2.5} fill={P.blue} />
        </g>
      ))}
      {/* x labels */}
      {data.map((d, i) => {
        if (data.length > 8 && i % 2 !== 0) return null;
        return (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle"
            fill={P.slateSm} fontSize={9}>{d.month || d.sem || ''}</text>
        );
      })}
      {/* y labels */}
      {[0, 25, 50, 75, 100].map(v => (
        <text key={v} x={padL - 5} y={toY(v)} textAnchor="end" dominantBaseline="middle"
          fill={P.slateSm} fontSize={9} fontFamily="monospace">{v}</text>
      ))}
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   UPLOAD PROMPT
───────────────────────────────────────────────────────────────────────────── */
const UploadPrompt = () => (
  <div className="db-upload-prompt">
    <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
    <div style={{ fontWeight: 800, fontSize: 16, color: P.slate, marginBottom: 6 }}>
      No marks data found
    </div>
    <div style={{ fontSize: 13, color: P.slateSm, marginBottom: 18, maxWidth: 340, margin: '0 auto 18px' }}>
      Upload your marks file to populate this dashboard with your real performance data.
    </div>
    <a href="/upload" style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: `linear-gradient(135deg, ${P.blue}, ${P.indigo})`,
      color: '#fff', borderRadius: 10,
      padding: '10px 24px', fontWeight: 700, fontSize: 13, textDecoration: 'none',
      boxShadow: `0 4px 16px ${P.blue}40`,
      transition: 'all 0.2s',
    }}>📂 Upload Marks Now →</a>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   DATA LOADER
───────────────────────────────────────────────────────────────────────────── */
function unwrap(res) {
  if (!res) return null;
  const body = res.data ?? res;
  if (body?.success === false) return null;
  return body?.data ?? body ?? null;
}

async function loadDashboardData(user) {
  let scores = [];

  try {
    const cached = sessionStorage.getItem('analyticsScores');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0)
        scores = parsed.filter(r => (r.subject || '').trim());
    }
  } catch (_) {}

  if (scores.length === 0) {
    try {
      const profileRaw = await profileService.getProfile().catch(() => null);
      const profile = unwrap(profileRaw);
      const subjectPerf = profile?.performance?.subjectPerformance || [];
      if (subjectPerf.length > 0) {
        scores = subjectPerf.map(s => ({
          subject: s.subject,
          score: parseFloat(s.score ?? s.average ?? 0),
          grade: s.grade,
          status: s.status,
          gpa: s.gpa,
          date: new Date().toISOString(),
        }));
      }
    } catch (_) {}
  }

  if (scores.length === 0) {
    const uid = user?.id || user?._id || user?.studentId;
    if (uid) {
      try {
        const dashRaw = await analyticsService.getStudentDashboard(uid).catch(() => null);
        const dash = unwrap(dashRaw);
        const items = [...(dash?.subjects || []), ...(dash?.recentActivity || [])];
        items.forEach(s => {
          const sc = parseFloat(s.statistics?.average ?? s.average ?? s.score ?? 0);
          const sub = s.subject || s.name || '';
          if (sub && sc > 0) scores.push({ subject: sub, score: sc, date: s.date || new Date().toISOString() });
        });
      } catch (_) {}
    }
  }

  if (scores.length === 0) return null;

  const vals = scores.map(s => parseFloat(s.score || 0)).filter(v => !isNaN(v));
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const gpa = scoreToGPA(avg);
  const passRate = (vals.filter(v => v >= 50).length / vals.length) * 100;
  const topScore = Math.max(...vals);
  const botScore = Math.min(...vals);

  const bySubject = {};
  scores.forEach(s => {
    const sub = s.subject || 'Unknown';
    if (!bySubject[sub]) bySubject[sub] = [];
    bySubject[sub].push(parseFloat(s.score || 0));
  });
  const subjects = Object.entries(bySubject).map(([name, vs]) => {
    const a = vs.reduce((x, y) => x + y, 0) / vs.length;
    return {
      name,
      score: parseFloat(a.toFixed(1)),
      gpa: scoreToGPA(a),
      pass: a >= 50,
      grade: getGrade(a),
    };
  }).sort((a, b) => b.score - a.score);

  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  vals.forEach(v => {
    const g = getGrade(v);
    if (g.startsWith('A')) dist.A++;
    else if (g.startsWith('B')) dist.B++;
    else if (g.startsWith('C')) dist.C++;
    else if (g === 'D') dist.D++;
    else dist.F++;
  });

  let semTrend = [];
  try {
    const pr = unwrap(await profileService.getProfile().catch(() => null));
    semTrend = pr?.performance?.semesterGpaTrend || [];
  } catch (_) {}
  if (!semTrend.length) {
    const chunkSize = Math.max(1, Math.ceil(subjects.length / 4));
    for (let i = 0; i < subjects.length; i += chunkSize) {
      const chunk = subjects.slice(i, i + chunkSize);
      const a = chunk.reduce((s, c) => s + c.score, 0) / chunk.length;
      semTrend.push({ sem: `S${semTrend.length + 1}`, gpa: scoreToGPA(a) });
    }
  }

  const byMonth = {};
  scores.forEach(s => {
    const d = s.date || s.uploadedAt || s.createdAt;
    if (!d) return;
    const key = new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(parseFloat(s.score || 0));
  });
  let trend = Object.entries(byMonth).map(([month, vs]) => ({
    month,
    average: parseFloat((vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1)),
  }));
  if (trend.length < 2 && semTrend.length >= 2) {
    trend = semTrend.map(s => ({
      month: s.sem,
      average: parseFloat(((s.gpa / 4.0) * 100).toFixed(1)),
    }));
  }

  let studyHabits = { dailyAverage: 0, weeklyTotal: 0, consistency: 0 };
  try {
    const pr = unwrap(await profileService.getProfile().catch(() => null));
    if (pr?.studyHabits) studyHabits = pr.studyHabits;
  } catch (_) {}

  const top = subjects[0];
  const bottom = subjects[subjects.length - 1];
  const failing = subjects.filter(s => !s.pass);
  const insights = [
    top && { icon: '🏆', color: P.amber, bg: '#fffbeb', text: 'Best subject: ', bold: `${top.name.split(' - ')[0]} (${top.score}%)`, tail: ` — Grade ${top.grade}` },
    bottom && bottom !== top && avg < 80 && { icon: '📉', color: P.red, bg: '#fff5f5', text: 'Needs attention: ', bold: `${bottom.name.split(' - ')[0]} (${bottom.score}%)`, tail: '. Consider extra study sessions.' },
    failing.length > 0 && { icon: '⚠️', color: P.red, bg: '#fff5f5', text: `${failing.length} subject${failing.length > 1 ? 's' : ''} below pass: `, bold: failing.map(s => s.name.split(' - ')[0]).join(', '), tail: '.' },
    { icon: '◎', color: P.blue, bg: P.blueBg, text: 'Overall average: ', bold: `${avg.toFixed(1)}%`, tail: ` with pass rate of ${passRate.toFixed(0)}%.` },
    { icon: '🎓', color: P.purple, bg: P.purpleBg, text: 'Estimated GPA: ', bold: `${gpa.toFixed(2)} / 4.0`, tail: ` — ${gpa >= 3.5 ? 'Excellent' : gpa >= 2.5 ? 'Good Standing' : gpa >= 2.0 ? 'Satisfactory' : 'At Risk'}` },
  ].filter(Boolean);

  return {
    avg: parseFloat(avg.toFixed(1)),
    gpa,
    passRate: parseFloat(passRate.toFixed(1)),
    topScore, botScore,
    totalAssessments: scores.length,
    risk: riskLevelFromGpa(gpa),
    riskSource: `GPA ${gpa.toFixed(2)} on 4.0`,
    subjects,
    dist,
    semTrend,
    trend,
    studyHabits,
    insights,
    failing,
    atRisk: subjects.filter(s => s.pass && s.score < 65),
    hasData: true,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadDashboardData(user);
      setD(result);
      setLastSync(new Date());
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const onStorage = e => { if (e.key === 'analyticsScores') refresh(); };
    const onUpload = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('marksUploaded', onUpload);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('marksUploaded', onUpload);
    };
  }, [refresh]);
  useEffect(() => {
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  /* ── LOADING ── */
  if (loading) return (
    <div className="db-loading">
      <div className="db-spinner" />
      <span style={{ color: P.slateSm, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Loading your performance data…
      </span>
    </div>
  );

  /* ── Shared greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.name || 'Student').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  /* ── NO DATA ── */
  if (!d) return (
    <div className="db-wrap">
      <div className="db-hero">
        <img src="/images/SLIIT-malabe.jpg" alt="SLIIT Malabe Campus" className="db-hero__bg"
          onError={e => { e.target.style.display = 'none'; }} />
        <div className="db-hero__overlay" />
        <div className="db-hero__mesh" />
        <div className="db-hero__content">
          <div className="db-hero__eyebrow">📅 {today}</div>
          <h1 className="db-hero__title">{greeting}, {firstName}!</h1>
          <p className="db-hero__sub">Upload your marks to unlock your full performance analytics dashboard.</p>
          <div className="db-hero__actions">
            <a href="/upload" className="db-hero__btn db-hero__btn--primary">📂 Upload Marks</a>
            <a href="/analytics" className="db-hero__btn db-hero__btn--ghost">📊 Analytics</a>
          </div>
        </div>
        <div className="db-hero__live"><span className="db-hero__live-dot" />Live</div>
      </div>
      <div className="db-content" style={{ paddingTop: 56 }}>
        <UploadPrompt />
      </div>
    </div>
  );

  const rc = riskCfg[d.risk] || riskCfg.Medium;
  const effScore = Math.min(100, Math.round(d.avg * 0.9 + 10));

  return (
    <div className="db-wrap">

      {/* ── HERO ── */}
      <div className="db-hero">
        <img src="/images/SLIIT-malabe.jpg" alt="SLIIT Malabe Campus" className="db-hero__bg"
          onError={e => { e.target.style.display = 'none'; }} />
        <div className="db-hero__overlay" />
        <div className="db-hero__mesh" />
        <div className="db-hero__content">
          <div className="db-hero__eyebrow">📅 {today}</div>
          <h1 className="db-hero__title">{greeting}, {firstName}!</h1>
          <p className="db-hero__sub">
            {d.subjects.length > 0
              ? <>Tracking <strong style={{ color: '#93c5fd' }}>{d.subjects.length} subjects</strong> · Average <strong style={{ color: '#6ee7b7' }}>{d.avg}%</strong> · GPA <strong style={{ color: '#fcd34d' }}>{d.gpa.toFixed(2)}</strong></>
              : <>Upload your marks to unlock full analytics.</>}
          </p>
          <div className="db-hero__actions">
            <a href="/upload" className="db-hero__btn db-hero__btn--primary">📂 Upload Marks</a>
            <a href="/analytics" className="db-hero__btn db-hero__btn--ghost">📊 Analytics</a>
            <button onClick={refresh} className="db-hero__btn db-hero__btn--ghost"
              style={{ cursor: 'pointer' }}>↻ Refresh</button>
          </div>
          {lastSync && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 10, display: 'block' }}>
              Last synced {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="db-hero__live"><span className="db-hero__live-dot" />Live</div>
      </div>

      {/* ── FLOATING KPI STRIP ── */}
      <div className="db-kpi-strip">
        <KpiCard icon="🎓" label="Current GPA"      value={d.gpa.toFixed(2)}        sub="/ 4.0 scale"          color={scoreColor(d.avg)} accent={scoreColor(d.avg)} />
        <KpiCard icon="📊" label="Average Score"     value={`${d.avg}%`}             sub={`Pass rate ${d.passRate}%`} accent={P.blue} />
        <KpiCard icon="📝" label="Assessments"       value={d.totalAssessments}       sub={`${d.subjects.length} subjects`} accent={P.indigo} />
        <KpiCard icon="🏆" label="Top Score"         value={`${d.topScore}%`}         sub={`Lowest ${d.botScore}%`} color={P.green} accent={P.green} />
        <KpiCard
          icon={d.risk === 'Low' ? '✅' : d.risk === 'High' ? '🚨' : '⚠️'}
          label="Academic Risk"
          value={d.risk}
          sub="risk assessment"
          color={rc.color}
          accent={rc.color}
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="db-content">

        {/* ── Section: Analytics ── */}
        <SectionHeader icon="📊" title="Performance Overview" badge={`${d.subjects.length} subjects`} />

        {/* ── MAIN ANALYTICS ROW ── */}
        <div className="db-main-grid">

          {/* GPA Gauge */}
          <div className="db-card">
            <div className="db-card__head">
              <div className="db-card__head-icon">🎯</div>
              <span>Risk Assessment</span>
            </div>
            <GpaGauge gpa={d.gpa} risk={d.risk} />

            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 12,
              background: rc.bg,
              border: `1.5px solid ${rc.border}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: rc.color,
                marginBottom: 4
              }}>
                {rc.icon} {rc.label}
              </div>

              <div style={{
                fontSize: 11,
                color: P.slateSm,
                lineHeight: 1.5
              }}>
                {d.risk === 'Low'
                  ? 'Performing well — keep it up!'
                  : d.risk === 'Medium'
                  ? 'Some subjects need attention.'
                  : 'Urgent: Multiple subjects below threshold.'}
              </div>

              <div style={{
                marginTop: 8,
                fontSize: 10,
                color: P.slateXs
              }}>
                Based on {d.riskSource}
              </div>
            </div>
          </div>

          {/* Semester GPA Trend */}
          <div className="db-card">
            <div className="db-card__head">
              <div className="db-card__head-icon">📈</div>
              <span>GPA Trend</span>
              {d.semTrend.length >= 2 && (() => {
                const diff = d.semTrend.at(-1).gpa - d.semTrend.at(-2)?.gpa;
                return (
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    color: diff >= 0 ? P.green : P.red,
                    background: diff >= 0 ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${diff >= 0 ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: 10, padding: '2px 10px',
                    fontFamily: 'monospace',
                  }}>
                    {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}
                  </span>
                );
              })()}
            </div>
            {d.semTrend.length ? (
              <>
                <SemBars data={d.semTrend} />
                <div style={{
                  marginTop: 12, display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, color: P.slateSm, padding: '8px 12px',
                  background: P.bg, borderRadius: 8,
                }}>
                  <span>Target: <b style={{ color: P.blue, fontFamily: 'monospace' }}>3.70</b></span>
                  <span>Current: <b style={{ color: scoreColor(d.avg), fontFamily: 'monospace' }}>{d.gpa.toFixed(2)}</b></span>
                  <span>Δ: <b style={{ color: d.gpa >= 3.7 ? P.green : P.amber, fontFamily: 'monospace' }}>
                    {(d.gpa - 3.7).toFixed(2)}
                  </b></span>
                </div>
              </>
            ) : (
              <div style={{ color: P.slateSm, fontSize: 13, textAlign: 'center', padding: 24 }}>
                More uploads needed
              </div>
            )}
          </div>

          {/* Grade Distribution */}
          <div className="db-card">
            <div className="db-card__head">
              <div className="db-card__head-icon">📊</div>
              <span>Grade Distribution</span>
            </div>
            <GradeDist dist={d.dist} />
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{
                textAlign: 'center', padding: '10px', borderRadius: 10,
                background: P.blueBg, border: `1px solid ${P.blueLt}`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: P.blue, fontVariantNumeric: 'tabular-nums' }}>
                  {d.passRate}%
                </div>
                <div style={{ fontSize: 10, color: P.slateSm, marginTop: 2 }}>Pass Rate</div>
              </div>
              <div style={{
                textAlign: 'center', padding: '10px', borderRadius: 10,
                background: P.greenBg, border: '1px solid #a7f3d0',
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: P.green, fontVariantNumeric: 'tabular-nums' }}>
                  {d.gpa.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: P.slateSm, marginTop: 2 }}>GPA Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PERFORMANCE TREND CHART ── */}
        <div className="db-card db-trend-card">
          <div className="db-card__head">
            <div className="db-card__head-icon">📉</div>
            <span>Performance Trend</span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, color: P.slateSm,
              background: P.bg, padding: '3px 10px', borderRadius: 8,
              border: `1px solid ${P.border}`,
            }}>
              {d.totalAssessments} assessments
            </span>
          </div>
          <TrendChart data={
            d.trend.length ? d.trend :
            d.semTrend.length ? d.semTrend.map(s => ({
              month: s.sem,
              average: parseFloat(((s.gpa / 4.0) * 100).toFixed(1)),
            })) : []
          } />
        </div>

        {/* ── SUBJECTS ── */}
        <SectionHeader icon="📚" title="Subject Performance"
          badge={`${d.subjects.filter(s => s.pass).length}/${d.subjects.length} passing`}
          extra={
            <Chip
              label={d.subjects.filter(s => !s.pass).length === 0 ? '✓ All passing' : `${d.subjects.filter(s => !s.pass).length} failing`}
              color={d.subjects.filter(s => !s.pass).length === 0 ? P.green : P.red}
              bg={d.subjects.filter(s => !s.pass).length === 0 ? '#ecfdf5' : '#fef2f2'}
              border={d.subjects.filter(s => !s.pass).length === 0 ? '#a7f3d0' : '#fecaca'}
            />
          }
        />

        <div className="db-card db-subjects-card">
          {d.subjects.length ? (
            <div className="db-sub-grid">
              {d.subjects.map((s, i) => <SubjectCard key={i} s={s} delay={i * 60} />)}
            </div>
          ) : <UploadPrompt />}
        </div>

        {/* ── BOTTOM ROW ── */}
        <SectionHeader icon="⚡" title="Smart Analysis" />

        <div className="db-bottom-grid">

          {/* Study Efficiency */}
          <div className="db-card">
            <div className="db-card__head">
              <div className="db-card__head-icon">⚡</div>
              <span>Study Efficiency</span>
            </div>
            <EffDial score={effScore} />
            <div>
              {[
                { label: 'Daily Avg', val: `${d.studyHabits.dailyAverage || '—'}h`, color: P.blue },
                { label: 'Weekly Total', val: `${d.studyHabits.weeklyTotal || '—'}h`, color: P.green },
                { label: 'Consistency', val: `${d.studyHabits.consistency || '—'}%`, color: P.amber },
              ].map(r => (
                <div key={r.label} className="db-stat-row">
                  <span className="db-stat-label">{r.label}</span>
                  <span className="db-stat-value" style={{ color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="db-card">
            <div className="db-card__head">
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: `linear-gradient(135deg, ${P.blue}, ${P.purple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                boxShadow: `0 4px 12px ${P.blue}30`,
              }}>🤖</div>
              <span>AI Insights</span>
              <Chip label="Smart" color={P.purple} bg={P.purpleBg} border="#ddd6fe" size="sm"
                style={{ marginLeft: 'auto' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.insights.map((ins, i) => (
                <div key={i} className="db-insight-item"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="db-insight-icon" style={{ background: ins.bg }}>
                    <span>{ins.icon}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: P.slateMd, lineHeight: 1.6 }}>
                    {ins.text}
                    <strong style={{ color: P.slate }}>{ins.bold}</strong>
                    {ins.tail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Early Warning */}
          <div className="db-card">
            <div className="db-card__head">
              <div className="db-card__head-icon">⚠️</div>
              <span>Early Warning</span>
            </div>

            {/* Intervention score */}
            <div className="db-score-band" style={{ background: rc.bg, border: `1.5px solid ${rc.border}` }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: rc.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {d.risk === 'Low' ? '12' : d.risk === 'Medium' ? '47' : '81'}
              </span>
              <div>
                <div style={{ fontSize: 10, color: P.slateSm, marginBottom: 5 }}>
                  Intervention Score / 100
                </div>
                <Chip label={rc.label} color={rc.color} bg={rc.bg} border={rc.border} size="sm" />
              </div>
            </div>

            {/* Failing / at-risk list */}
            {d.failing.map(s => (
              <div key={s.name} className="db-warning-item db-warning-item--fail">
                <span>🚨</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: P.slate }}>
                    Failing: {s.name.split(' - ')[0]}
                  </div>
                  <div style={{ fontSize: 11, color: P.slateSm }}>
                    Score {s.score}% — urgent revision needed
                  </div>
                </div>
              </div>
            ))}
            {d.atRisk.map(s => (
              <div key={s.name} className="db-warning-item db-warning-item--risk">
                <span>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: P.slate }}>
                    At Risk: {s.name.split(' - ')[0]}
                  </div>
                  <div style={{ fontSize: 11, color: P.slateSm }}>
                    Score {s.score}% — borderline pass
                  </div>
                </div>
              </div>
            ))}
            {d.failing.length === 0 && d.atRisk.length === 0 && (
              <div className="db-warning-item db-warning-item--ok">
                <span>✅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: P.slate }}>On Track</div>
                  <div style={{ fontSize: 11, color: P.slateSm }}>No critical risks detected</div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.6px', color: P.slateSm, marginBottom: 8,
              }}>Recommended Actions</div>
              {[...d.failing, ...d.atRisk].slice(0, 3).map((s, i) => (
                <div key={i} className="db-rec-item">
                  📌 {!s.pass
                    ? `Schedule tutoring for ${s.name.split(' - ')[0]}`
                    : `Dedicate 3+ extra hours to ${s.name.split(' - ')[0]}`}
                </div>
              ))}
              {d.failing.length === 0 && d.atRisk.length === 0 && (
                <div className="db-rec-item" style={{ borderLeftColor: P.green, background: '#f0fdf4' }}>
                  ✅ Continue current study pace — GPA trending well
                </div>
              )}
            </div>
          </div>
        </div>

      </div>{/* end .db-content */}
    </div>
  );
}