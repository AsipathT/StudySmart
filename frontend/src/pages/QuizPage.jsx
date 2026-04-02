import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import {
  FilePdfOutlined,
  RocketOutlined,
  RobotOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  BookOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  LaptopOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import subjectService from '../services/subjectService';
import quizService from '../services/quizService';
import './QuizPage.css';

// ── Gradient helpers (mirrors StudySessionPage) ──────────────────────────────
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
    case 'science': case 'Atom': return <ExperimentOutlined />;
    case 'history': case 'History': return <HistoryOutlined />;
    case 'language': case 'Globe': return <GlobalOutlined />;
    case 'Laptop': return <LaptopOutlined />;
    default: return <BookOutlined />;
  }
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const getScoreConfig = (pct) => {
  if (pct >= 90) return { label: 'Outstanding!',  color: '#4ade80', glow: 'rgba(74,222,128,0.3)',  bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)' };
  if (pct >= 70) return { label: 'Great Job!',     color: '#60a5fa', glow: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)' };
  if (pct >= 50) return { label: 'Good Effort',    color: '#fbbf24', glow: 'rgba(251,191,36,0.3)',  bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)' };
  return               { label: 'Keep Practising', color: '#f87171', glow: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' };
};

// ── QuizPage ─────────────────────────────────────────────────────────────────
const QuizPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects]               = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [quizzes, setQuizzes]                 = useState([]);
  const [activeQuiz, setActiveQuiz]           = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [generating, setGenerating]           = useState(false);
  const [generatingMat, setGeneratingMat]     = useState(null);

  const [stage, setStage]                       = useState('list');
  const [currentQuestionIndex, setCurrentQ]     = useState(0);
  const [userAnswers, setUserAnswers]           = useState([]);
  const [quizScore, setQuizScore]               = useState(0);
  const [quizHistory, setQuizHistory]           = useState([]);
  const [historyLoading, setHistoryLoading]     = useState(false);

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const resp = await subjectService.getAllSubjects();
      setSubjects(resp.data);
    } catch { message.error('Failed to fetch subjects'); }
    finally { setLoading(false); }
  };

  const handleSubjectSelect = async (subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    try {
      const resp = await quizService.getQuizzesForSubject(subject._id);
      setQuizzes(resp.data.data);
      setStage('subject-quizzes');
    } catch { message.error('Failed to load quizzes'); }
    finally { setLoading(false); }
  };

  const generateQuizFromMaterial = async (material) => {
    setGenerating(true);
    setGeneratingMat(material.name);
    try {
      const resp = await quizService.generateQuiz({
        subjectId: selectedSubject._id,
        materialName: material.name,
        fileUrl: material.fileUrl,
      });
      message.success('Quiz generated with Gemini AI Pro!');
      setQuizzes([resp.data.data, ...quizzes]);
    } catch (e) {
      message.error(e.response?.data?.message || 'Quiz generation failed');
    } finally {
      setGenerating(false);
      setGeneratingMat(null);
    }
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setStage('taking');
    setCurrentQ(0);
    setUserAnswers(new Array(quiz.questions.length).fill(null));
  };

  const handleSelectOption = (idx) => {
    const updated = [...userAnswers];
    updated[currentQuestionIndex] = idx;
    setUserAnswers(updated);
  };

  const finishQuiz = async () => {
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    setQuizScore(score);
    setStage('result');
    try {
      await quizService.submitAttempt({
        quizId: activeQuiz._id,
        answers: userAnswers,
        score,
        totalQuestions: activeQuiz.questions.length,
      });
    } catch { /* silent */ }
  };

  const reset = () => {
    setStage('list');
    setSelectedSubject(null);
    setActiveQuiz(null);
  };

  const openHistory = async () => {
    setStage('history');
    setHistoryLoading(true);
    try {
      const resp = await quizService.getHistory();
      const raw = resp.data?.data ?? resp.data ?? [];
      setQuizHistory(Array.isArray(raw) ? raw : []);
    } catch {
      message.error('Failed to load quiz history');
      setQuizHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spin size="large" />
    </div>
  );

  const pct = activeQuiz ? Math.round((quizScore / activeQuiz.questions.length) * 100) : 0;
  const scoreConfig = getScoreConfig(pct);

  return (
    <div className="quiz-page-container">

      {/* ── Static background visuals ── */}
      <div className="quiz-bg" aria-hidden="true">
        <div className="quiz-bg-glow quiz-bg-glow-1" />
        <div className="quiz-bg-glow quiz-bg-glow-2" />
        <div className="quiz-bg-glow quiz-bg-glow-3" />
        <div className="quiz-bg-dots" />
        <div className="quiz-bg-shape quiz-bg-shape-1" />
        <div className="quiz-bg-shape quiz-bg-shape-2" />
        <div className="quiz-bg-shape quiz-bg-shape-3" />
        <div className="quiz-bg-line quiz-bg-line-1" />
        <div className="quiz-bg-line quiz-bg-line-2" />
        <div className="quiz-bg-hex quiz-bg-hex-1">⬡</div>
        <div className="quiz-bg-hex quiz-bg-hex-2">⬡</div>
        <div className="quiz-bg-hex quiz-bg-hex-3">∑</div>
        <div className="quiz-bg-hex quiz-bg-hex-4">◈</div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STAGE: list — subject tiles
      ══════════════════════════════════════════════════════ */}
      {stage === 'list' && (
        <div className="quiz-stage">
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                }}>
                  <RobotOutlined style={{ color: '#fff', fontSize: 18 }} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
                    AI-Powered Quizzes
                  </h1>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                    Select a subject to take or generate quizzes
                  </p>
                </div>
              </div>
              <button className="quiz-history-btn" onClick={openHistory}>
                <HistoryOutlined style={{ fontSize: 13 }} />
                Quiz History
              </button>
            </div>
          </div>

          {/* Subject grid */}
          <div className="quiz-subject-grid">
            {subjects.map(subj => (
              <div
                key={subj._id}
                className="quiz-subject-tile"
                onClick={() => handleSubjectSelect(subj)}
                style={{ '--tile-gradient': getSubjectGradient(subj.color) }}
              >
                {/* Decorations */}
                <div className="qtile-deco-circle" />
                <div className="qtile-deco-circle-sm" />
                <div className="qtile-deco-dots" />

                {/* Icon */}
                <div className="qtile-icon">
                  {getSubjectIcon(subj.icon)}
                </div>

                {/* Name */}
                <div className="qtile-name">{subj.name}</div>

                {/* Meta row */}
                <div className="qtile-meta">
                  <span>{subj.units?.length || 0} units</span>
                  <span className="qtile-dot" />
                  <span>AI quizzes</span>
                </div>

                {/* Bottom action bar */}
                <div className="qtile-action">
                  <RobotOutlined style={{ fontSize: 11, opacity: 0.7 }} />
                  <span>View Quizzes</span>
                  <ArrowRightOutlined className="qtile-arrow" />
                </div>
              </div>
            ))}
          </div>

          {subjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p style={{ fontSize: 16 }}>No subjects available yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STAGE: subject-quizzes
      ══════════════════════════════════════════════════════ */}
      {stage === 'subject-quizzes' && (
        <div className="quiz-stage">
          {/* Back + Subject banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <button className="quiz-back-btn" onClick={() => setStage('list')}>
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back
            </button>
            <div
              className="quiz-subject-banner"
              style={{ '--tile-gradient': getSubjectGradient(selectedSubject?.color) }}
            >
              <div className="qbanner-icon">{getSubjectIcon(selectedSubject?.icon)}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{selectedSubject?.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available
                </div>
              </div>
            </div>
          </div>

          <div className="quiz-two-col">
            {/* Left: quiz list */}
            <div className="quiz-panel">
              <div className="quiz-panel-header">
                <TrophyOutlined style={{ color: '#fbbf24' }} />
                Available Quizzes
                <span className="quiz-count-badge">{quizzes.length}</span>
              </div>

              {quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)' }}>
                  <RobotOutlined style={{ fontSize: 36, marginBottom: 10 }} />
                  <p style={{ fontSize: 13 }}>No quizzes yet. Generate one from a material →</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quizzes.map((q, i) => (
                    <div key={q._id || i} className="quiz-list-item">
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 4 }}>{q.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            <FilePdfOutlined style={{ marginRight: 4 }} />{q.materialName}
                          </span>
                          <span className="quiz-q-badge">{q.questions.length} Qs</span>
                        </div>
                      </div>
                      <button className="quiz-take-btn" onClick={() => startQuiz(q)}>
                        Take Quiz <ArrowRightOutlined style={{ fontSize: 11 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: generate */}
            <div className="quiz-panel">
              <div className="quiz-panel-header">
                <RobotOutlined style={{ color: '#818cf8' }} />
                Generate with AI
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16, lineHeight: 1.6 }}>
                Upload PDFs via Manage Subject, then generate AI quizzes below.
              </p>

              {/* Subject-wide materials */}
              {(selectedSubject?.materials?.length || 0) > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="quiz-mat-section-label">Subject Materials</div>
                  {selectedSubject.materials.map((mat, i) => (
                    <div key={i} className="quiz-mat-row">
                      <FilePdfOutlined style={{ color: '#f87171', fontSize: 14, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.name}</span>
                      <button
                        className="quiz-gen-btn"
                        disabled={generating}
                        onClick={() => generateQuizFromMaterial(mat)}
                      >
                        {generating && generatingMat === mat.name
                          ? <Spin size="small" />
                          : <><ThunderboltOutlined style={{ fontSize: 11 }} /> Generate</>
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Unit materials */}
              {selectedSubject?.units?.map(unit => (
                (unit.materials?.length || 0) > 0 && (
                  <div key={unit._id} style={{ marginBottom: 16 }}>
                    <div className="quiz-mat-section-label">{unit.name}</div>
                    {unit.materials.map((m, j) => (
                      <div key={j} className="quiz-mat-row">
                        <FilePdfOutlined style={{ color: '#f87171', fontSize: 14, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        <button
                          className="quiz-gen-btn"
                          disabled={generating}
                          onClick={() => generateQuizFromMaterial(m)}
                        >
                          {generating && generatingMat === m.name
                            ? <Spin size="small" />
                            : <><ThunderboltOutlined style={{ fontSize: 11 }} /> Generate</>
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ))}

              {!(selectedSubject?.materials?.length) && !selectedSubject?.units?.some(u => u.materials?.length) && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                  No PDF materials uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STAGE: taking
      ══════════════════════════════════════════════════════ */}
      {stage === 'taking' && activeQuiz && (
        <div className="quiz-stage quiz-taking-stage">
          {/* Top progress bar */}
          <div className="quiz-progress-bar-wrap">
            <div
              className="quiz-progress-bar-fill"
              style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button className="quiz-back-btn" onClick={reset}>
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> Exit
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{activeQuiz.title}</div>
            </div>
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 5 }}>
              {activeQuiz.questions.map((_, i) => (
                <div key={i} style={{
                  width: i === currentQuestionIndex ? 20 : 7,
                  height: 7, borderRadius: 100,
                  background: i < currentQuestionIndex
                    ? (userAnswers[i] !== null ? '#6366f1' : 'rgba(255,255,255,0.15)')
                    : i === currentQuestionIndex
                      ? '#818cf8'
                      : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.2s',
                }} />
              ))}
            </div>
          </div>

          {/* Question card */}
          <div className="quiz-question-card">
            <div className="quiz-q-number">Q{currentQuestionIndex + 1}</div>
            <div className="quiz-q-text">
              {activeQuiz.questions[currentQuestionIndex].question}
            </div>

            {/* Options */}
            <div className="quiz-options">
              {activeQuiz.questions[currentQuestionIndex].options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`quiz-option ${userAnswers[currentQuestionIndex] === idx ? 'quiz-option-selected' : ''}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <span className="quiz-option-letter">{OPTION_LABELS[idx]}</span>
                  <span className="quiz-option-text">{opt}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="quiz-nav">
              <button
                className="quiz-nav-btn quiz-nav-prev"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQ(p => p - 1)}
              >
                <ArrowLeftOutlined style={{ fontSize: 12 }} /> Previous
              </button>

              {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                <button
                  className="quiz-nav-btn quiz-nav-finish"
                  disabled={userAnswers[currentQuestionIndex] === null}
                  onClick={finishQuiz}
                >
                  Finish Quiz <CheckCircleOutlined style={{ fontSize: 13 }} />
                </button>
              ) : (
                <button
                  className="quiz-nav-btn quiz-nav-next"
                  disabled={userAnswers[currentQuestionIndex] === null}
                  onClick={() => setCurrentQ(p => p + 1)}
                >
                  Next <ArrowRightOutlined style={{ fontSize: 12 }} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STAGE: history
      ══════════════════════════════════════════════════════ */}
      {stage === 'history' && (() => {
        const totalAttempts = quizHistory.length;
        const bestScore  = totalAttempts ? Math.max(...quizHistory.map(a => Math.round((a.score / (a.totalQuestions || 1)) * 100))) : 0;
        const avgScore   = totalAttempts ? Math.round(quizHistory.reduce((s, a) => s + (a.score / (a.totalQuestions || 1)) * 100, 0) / totalAttempts) : 0;

        return (
          <div className="quiz-stage">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <button className="quiz-back-btn" onClick={() => setStage('list')}>
                <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                }}>
                  <HistoryOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.4px' }}>Quiz History</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {totalAttempts} attempt{totalAttempts !== 1 ? 's' : ''} recorded
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            {totalAttempts > 0 && (
              <div className="quiz-hist-stats">
                {[
                  { label: 'Total Attempts', value: totalAttempts, color: '#818cf8' },
                  { label: 'Best Score',     value: `${bestScore}%`, color: '#4ade80' },
                  { label: 'Average Score',  value: `${avgScore}%`,  color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} className="quiz-hist-stat">
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* List */}
            {historyLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Spin size="large" />
              </div>
            ) : totalAttempts === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.25)' }}>
                <HistoryOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
                <p style={{ fontSize: 16, margin: 0 }}>No quiz attempts yet.</p>
                <p style={{ fontSize: 13, marginTop: 6, color: 'rgba(255,255,255,0.18)' }}>Complete a quiz to see your history here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizHistory.map((attempt, i) => {
                  const pctA        = Math.round((attempt.score / (attempt.totalQuestions || 1)) * 100);
                  const cfg         = getScoreConfig(pctA);
                  const quizTitle   = attempt.quizId?.title    ?? attempt.title        ?? `Quiz #${i + 1}`;
                  const materialName= attempt.quizId?.materialName ?? attempt.materialName ?? '';
                  const subjectName = attempt.quizId?.subjectId?.name ?? attempt.subjectName ?? '';
                  const subjectColor= attempt.quizId?.subjectId?.color ?? null;
                  const dateStr     = attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '';
                  const timeStr     = attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const circ        = 2 * Math.PI * 22;

                  return (
                    <div key={attempt._id || i} className="quiz-history-item">
                      {/* Mini score ring */}
                      <div className="quiz-hist-score-wrap">
                        <svg viewBox="0 0 56 56" width="56" height="56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                          <circle
                            cx="28" cy="28" r="22"
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            strokeDashoffset={circ * (1 - pctA / 100)}
                            transform="rotate(-90 28 28)"
                            style={{ filter: `drop-shadow(0 0 4px ${cfg.color}77)` }}
                          />
                        </svg>
                        <div className="quiz-hist-score-inner">
                          <span style={{ fontSize: 10, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{pctA}%</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{quizTitle}</span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
                            borderRadius: 100, fontSize: 10, fontWeight: 800,
                            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                          }}>{cfg.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {materialName && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                              <FilePdfOutlined style={{ marginRight: 3 }} />{materialName}
                            </span>
                          )}
                          {subjectName && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                              background: subjectColor ? getSubjectGradient(subjectColor) : 'rgba(99,102,241,0.18)',
                              color: '#fff',
                            }}>{subjectName}</span>
                          )}
                        </div>
                      </div>

                      {/* Score + date */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 900, color: cfg.color,
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                          padding: '4px 12px', borderRadius: 8,
                          fontFamily: "'SF Mono','Fira Code',monospace",
                        }}>
                          {attempt.score}/{attempt.totalQuestions}
                        </div>
                        {dateStr && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'right', lineHeight: 1.4 }}>
                            {dateStr}<br /><span style={{ fontSize: 10, opacity: 0.7 }}>{timeStr}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          STAGE: result
      ══════════════════════════════════════════════════════ */}
      {stage === 'result' && activeQuiz && (
        <div className="quiz-stage quiz-result-stage">
          <div className="quiz-result-card">
            {/* Top accent */}
            <div style={{ height: 4, background: `linear-gradient(90deg,${scoreConfig.color},#818cf8,#06b6d4)`, borderRadius: '18px 18px 0 0', margin: '-1px -1px 0' }} />

            <div style={{ padding: '40px 40px 36px', textAlign: 'center' }}>
              {/* Score ring */}
              <div className="quiz-score-ring" style={{ '--score-color': scoreConfig.color, '--score-glow': scoreConfig.glow }}>
                <svg viewBox="0 0 100 100" className="quiz-score-svg">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={scoreConfig.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                    transform="rotate(-90 50 50)"
                    style={{ filter: `drop-shadow(0 0 6px ${scoreConfig.color})`, transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="quiz-score-inner">
                  <div style={{ fontSize: 32, fontWeight: 900, color: scoreConfig.color, lineHeight: 1 }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 3 }}>SCORE</div>
                </div>
              </div>

              {/* Performance label */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 18px', borderRadius: 100, marginTop: 16, marginBottom: 8,
                background: scoreConfig.bg, border: `1px solid ${scoreConfig.border}`,
                fontSize: 14, fontWeight: 800, color: scoreConfig.color,
              }}>
                <TrophyOutlined /> {scoreConfig.label}
              </div>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
                {quizScore} correct out of {activeQuiz.questions.length} questions
              </div>

              {/* Stats row */}
              <div className="quiz-result-stats">
                {[
                  { label: 'Correct',   value: quizScore,                                  color: '#4ade80' },
                  { label: 'Wrong',     value: activeQuiz.questions.length - quizScore,    color: '#f87171' },
                  { label: 'Total',     value: activeQuiz.questions.length,                color: '#818cf8' },
                ].map(s => (
                  <div key={s.label} className="quiz-result-stat">
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Answer breakdown */}
              <div className="quiz-breakdown">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12, textAlign: 'left' }}>Answer Review</div>
                {activeQuiz.questions.map((q, i) => {
                  const correct = userAnswers[i] === q.correctAnswer;
                  return (
                    <div key={i} className={`quiz-breakdown-row ${correct ? 'breakdown-correct' : 'breakdown-wrong'}`}>
                      <div className="breakdown-indicator">
                        {correct
                          ? <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 14 }} />
                          : <CloseCircleOutlined style={{ color: '#f87171', fontSize: 14 }} />}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}>Q{i + 1}: {q.question}</div>
                        {!correct && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                            Correct: <span style={{ color: '#4ade80', fontWeight: 700 }}>{q.options[q.correctAnswer]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                <button className="quiz-back-btn" onClick={() => { setStage('subject-quizzes'); }}>
                  <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back to Quizzes
                </button>
                <button className="quiz-take-btn" onClick={reset}>
                  All Subjects <ArrowRightOutlined style={{ fontSize: 11 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizPage;
