import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import './ChatbotPage.css';

/* ════════════════════════════════════════════════════════════════════
   STUDYSMART AI — Premium Chatbot UI
   Fixes: real student data from all sources, correct GPA calc,
   rich context sent to chatbot API, beautiful redesigned CSS
   ════════════════════════════════════════════════════════════════════ */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap');

  /* ── Reset & Root ────────────────────────────────────────────────── */
  .ss-root *, .ss-root *::before, .ss-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }

  .ss-root {
    font-family: 'Outfit', sans-serif;
    display: flex;
    height: calc(100vh - 64px);
    background: #0d0e1a;
    overflow: hidden;
    position: relative;
    color: #e2e4f0;
  }

  /* ── Ambient background grid ─────────────────────────────────────── */
  .ss-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* ════ CHAT COLUMN ════════════════════════════════════════════════ */
  .ss-col {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 1;
  }

  /* ── Top bar ─────────────────────────────────────────────────────── */
  .ss-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 66px;
    background: rgba(13,14,26,0.95);
    border-bottom: 1px solid rgba(99,102,241,0.18);
    flex-shrink: 0;
    backdrop-filter: blur(20px);
    position: relative;
  }
  .ss-bar::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(168,85,247,0.5), transparent);
  }
  .ss-bar-left { display: flex; align-items: center; gap: 14px; }
  .ss-ai-badge {
    width: 42px; height: 42px; border-radius: 14px;
    background: linear-gradient(140deg, #6366f1 0%, #a855f7 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 24px rgba(99,102,241,0.5), 0 0 48px rgba(99,102,241,0.2);
    flex-shrink: 0; position: relative; overflow: hidden;
    animation: ss-badge-glow 3s ease-in-out infinite;
  }
  @keyframes ss-badge-glow {
    0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.15); }
    50%      { box-shadow: 0 0 32px rgba(168,85,247,0.6), 0 0 56px rgba(168,85,247,0.2); }
  }
  .ss-ai-badge::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 60%);
  }
  .ss-bar-name {
    font-size: 15px; font-weight: 700; color: #f0f1ff;
    letter-spacing: -.3px; line-height: 1;
  }
  .ss-bar-status { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .ss-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; position: relative; flex-shrink: 0;
  }
  .ss-pulse-dot::after {
    content:''; position:absolute; inset:-3px; border-radius:50%;
    background: rgba(34,197,94,0.35);
    animation: ss-ripple 2s ease-out infinite;
  }
  .ss-status-txt { font-size: 11.5px; color: #5d6494; font-weight: 500; font-family: 'Fira Code', monospace; }
  .ss-panel-btn {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 600; color: #818cf8;
    padding: 7px 16px; border-radius: 10px;
    border: 1px solid rgba(99,102,241,0.25);
    background: rgba(99,102,241,0.08);
    cursor: pointer; font-family: 'Outfit', sans-serif;
    transition: all .2s; letter-spacing: .2px;
  }
  .ss-panel-btn:hover {
    background: rgba(99,102,241,0.16);
    border-color: rgba(99,102,241,0.45);
    color: #a5b4fc;
    box-shadow: 0 0 16px rgba(99,102,241,0.2);
  }

  /* ── Student stats bar ───────────────────────────────────────────── */
  .ss-student-bar {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 10px 28px;
    background: rgba(13,14,26,0.8);
    border-bottom: 1px solid rgba(99,102,241,0.1);
    font-size: 12px; font-weight: 600;
    backdrop-filter: blur(12px);
  }
  .ss-sbar-label { font-size: 11px; color: #4a5082; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; font-family: 'Fira Code', monospace; }
  .ss-sstat {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 20px;
    background: rgba(99,102,241,0.12);
    color: #a5b4fc;
    border: 1px solid rgba(99,102,241,0.2);
    font-size: 12px; font-weight: 600;
    transition: all .2s;
  }
  .ss-sstat:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); }
  .ss-sstat.risk-high  { background: rgba(239,68,68,0.12);   color: #f87171; border-color: rgba(239,68,68,0.25); }
  .ss-sstat.risk-med   { background: rgba(245,158,11,0.12);  color: #fbbf24; border-color: rgba(245,158,11,0.25); }
  .ss-sstat.risk-low   { background: rgba(34,197,94,0.12);   color: #4ade80; border-color: rgba(34,197,94,0.25); }
  .ss-sstat-loading { animation: ss-shimmer 1.5s ease-in-out infinite; }
  @keyframes ss-shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }

  /* ── Feed ────────────────────────────────────────────────────────── */
  .ss-feed {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 32px 32px 20px;
    display: flex; flex-direction: column;
    background: transparent;
    position: relative;
  }
  .ss-feed-inner { max-width: 720px; width: 100%; margin: 0 auto; }

  /* Date divider */
  .ss-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 0 0 28px; color: #3a3f6e; font-size: 11px;
    font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
    font-family: 'Fira Code', monospace;
  }
  .ss-divider::before, .ss-divider::after {
    content:''; flex:1; height:1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent);
  }

  /* User message */
  .ss-msg-row-user {
    display: flex; align-items: flex-end;
    justify-content: flex-end;
    gap: 10px; margin-bottom: 16px;
    animation: ss-slide-up .25s cubic-bezier(.22,.68,0,1.2) both;
  }
  .ss-user-meta { display: flex; flex-direction: column; align-items: flex-end; max-width: 70%; }
  .ss-bubble-user {
    background: linear-gradient(140deg, #4f46e5 0%, #7c3aed 100%);
    color: #f0f1ff; font-size: 14px; line-height: 1.65; font-weight: 400;
    padding: 13px 18px; border-radius: 22px 22px 5px 22px;
    word-break: break-word; white-space: pre-wrap;
    min-width: 44px; width: fit-content; max-width: 100%;
    box-shadow: 0 4px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset;
    position: relative;
  }
  .ss-user-ava {
    width: 34px; height: 34px; border-radius: 11px;
    background: linear-gradient(135deg, #1e2035, #2a2d50);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(99,102,241,0.3);
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }

  /* AI message */
  .ss-msg-row-ai {
    display: flex; align-items: flex-start;
    gap: 10px; margin-bottom: 16px;
    animation: ss-slide-up .25s cubic-bezier(.22,.68,0,1.2) both;
  }
  .ss-ai-meta { display: flex; flex-direction: column; max-width: 78%; }
  .ss-bubble-ai {
    background: rgba(22,24,44,0.9);
    backdrop-filter: blur(12px);
    color: #d4d8f0; font-size: 14px; line-height: 1.8; font-weight: 400;
    padding: 15px 20px; border-radius: 5px 22px 22px 22px;
    word-break: break-word; white-space: pre-wrap;
    min-width: 44px; width: fit-content; max-width: 100%;
    border: 1px solid rgba(99,102,241,0.15);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset;
    position: relative;
  }
  .ss-bubble-ai strong { color: #a5b4fc; font-weight: 700; }
  .ss-ai-ava {
    width: 34px; height: 34px; border-radius: 11px;
    background: linear-gradient(140deg, #4f46e5, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px rgba(99,102,241,0.4);
    position: relative; overflow: hidden;
    margin-top: 2px;
  }
  .ss-ai-ava::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%);
  }

  /* Error bubble */
  .ss-bubble-error {
    background: rgba(239,68,68,0.1);
    color: #f87171; font-size: 14px; line-height: 1.6; font-weight: 400;
    padding: 13px 18px; border-radius: 5px 22px 22px 22px;
    word-break: break-word; white-space: pre-wrap;
    min-width: 44px; width: fit-content; max-width: 100%;
    border: 1px solid rgba(239,68,68,0.2);
  }

  /* Timestamp */
  .ss-msg-ts {
    font-size: 10px; color: #363a5e; margin-top: 5px;
    font-family: 'Fira Code', monospace; font-weight: 400;
    padding: 0 4px;
  }
  .ss-msg-ts-right { text-align: right; }

  /* ── Typing indicator ─────────────────────────────────────────────── */
  .ss-typing-row { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 16px; }
  .ss-typing-bubble {
    background: rgba(22,24,44,0.9);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 5px 22px 22px 22px;
    padding: 15px 20px;
    display: inline-flex; align-items: center; gap: 6px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    backdrop-filter: blur(12px);
  }
  .ss-tdot {
    width: 7px; height: 7px; border-radius: 50%;
    animation: ss-bounce 1.4s ease-in-out infinite;
  }
  .ss-tdot:nth-child(1) { background: #4f46e5; animation-delay: 0s; }
  .ss-tdot:nth-child(2) { background: #7c3aed; animation-delay: .18s; }
  .ss-tdot:nth-child(3) { background: #a855f7; animation-delay: .36s; }

  /* ── Empty state ──────────────────────────────────────────────────── */
  .ss-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 24px; text-align: center; min-height: 100%;
  }
  .ss-empty-ring {
    position: relative; margin-bottom: 32px;
    display: flex; align-items: center; justify-content: center;
  }
  .ss-empty-ring::before {
    content:''; position:absolute;
    inset: -24px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%);
    animation: ss-breathe 3.5s ease-in-out infinite;
  }
  .ss-empty-ring::after {
    content:''; position:absolute;
    inset: -10px; border-radius: 50%;
    border: 1px dashed rgba(99,102,241,0.3);
    animation: ss-spin 25s linear infinite;
  }
  .ss-empty-icon {
    position: relative; width: 80px; height: 80px; border-radius: 28px;
    background: linear-gradient(140deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow:
      0 0 40px rgba(99,102,241,0.5),
      0 0 80px rgba(99,102,241,0.2),
      0 0 0 1px rgba(255,255,255,0.1) inset;
  }
  .ss-empty-h {
    font-size: 28px; font-weight: 800; color: #e8eaff;
    letter-spacing: -.8px; margin-bottom: 12px;
    background: linear-gradient(135deg, #e0e0ff, #a5b4fc);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .ss-empty-p { font-size: 14px; color: #4a5082; max-width: 320px; line-height: 1.7; margin-bottom: 36px; font-weight: 400; }
  .ss-empty-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 460px; }
  .ss-empty-card {
    padding: 18px 16px; border-radius: 20px;
    background: rgba(22,24,44,0.8);
    border: 1px solid rgba(99,102,241,0.15);
    text-align: left; cursor: pointer;
    font-family: 'Outfit', sans-serif;
    transition: all .22s cubic-bezier(.22,.68,0,1.2);
    position: relative; overflow: hidden;
    backdrop-filter: blur(8px);
  }
  .ss-empty-card::before {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 100%);
    opacity: 0; transition: opacity .22s;
  }
  .ss-empty-card:hover {
    border-color: rgba(99,102,241,0.4);
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 32px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.25);
  }
  .ss-empty-card:hover::before { opacity: 1; }
  .ss-empty-card-icon { font-size: 22px; margin-bottom: 10px; display: block; }
  .ss-empty-card-label { font-size: 13px; font-weight: 700; color: #c4c8f0; line-height: 1.4; }
  .ss-empty-card-sub { font-size: 11.5px; color: #4a5082; margin-top: 4px; line-height: 1.4; }

  /* ── Input area ───────────────────────────────────────────────────── */
  .ss-input-wrap {
    flex-shrink: 0;
    padding: 14px 28px 20px;
    background: rgba(13,14,26,0.95);
    border-top: 1px solid rgba(99,102,241,0.1);
    backdrop-filter: blur(20px);
    position: relative;
  }
  .ss-input-wrap::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(168,85,247,0.4), transparent);
  }
  .ss-pills {
    display: flex; flex-wrap: wrap; gap: 7px;
    max-width: 720px; margin: 0 auto 12px;
  }
  .ss-pill {
    padding: 5px 14px; border-radius: 20px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    font-size: 11.5px; font-weight: 600; color: #818cf8;
    cursor: pointer; font-family: 'Outfit', sans-serif;
    transition: all .18s; letter-spacing: .1px;
  }
  .ss-pill:hover {
    background: rgba(99,102,241,0.18);
    border-color: rgba(99,102,241,0.45);
    color: #a5b4fc;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.2);
  }
  .ss-inputbox {
    display: flex; align-items: flex-end; gap: 10px;
    background: rgba(22,24,44,0.9);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 20px; padding: 10px 10px 10px 20px;
    transition: border-color .2s, box-shadow .2s;
    max-width: 720px; margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    backdrop-filter: blur(12px);
  }
  .ss-inputbox:focus-within {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 4px rgba(99,102,241,0.1), 0 4px 20px rgba(0,0,0,0.3);
  }
  .ss-ta {
    flex: 1; border: none; background: transparent; outline: none;
    font-size: 14px; font-weight: 400; color: #d4d8f0;
    resize: none; line-height: 1.6;
    min-height: 24px; max-height: 128px;
    font-family: 'Outfit', sans-serif;
  }
  .ss-ta::placeholder { color: #2e3258; font-weight: 400; }
  .ss-send {
    width: 40px; height: 40px; border-radius: 13px; border: none;
    background: linear-gradient(140deg, #4f46e5, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(99,102,241,0.5);
    transition: all .18s;
    position: relative; overflow: hidden;
  }
  .ss-send::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%);
  }
  .ss-send:hover:not(:disabled) {
    transform: scale(1.06);
    box-shadow: 0 6px 24px rgba(99,102,241,0.6);
  }
  .ss-send:active:not(:disabled) { transform: scale(.92); }
  .ss-send:disabled { opacity: .25; cursor: not-allowed; box-shadow: none; }
  .ss-footer-hint {
    text-align: center; font-size: 10.5px; color: #252842; margin-top: 10px;
    font-family: 'Fira Code', monospace; letter-spacing: .3px;
  }
  .ss-footer-hint kbd {
    background: rgba(22,24,44,0.9);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 5px; padding: 1px 7px;
    font-size: 10px; color: #4a5082;
    box-shadow: 0 1px 0 rgba(99,102,241,0.2);
    font-family: 'Fira Code', monospace;
  }

  /* ════ RIGHT PANEL ════════════════════════════════════════════════ */
  .ss-panel {
    width: 310px; flex-shrink: 0; height: 100%;
    overflow-y: auto; overflow-x: hidden;
    background: rgba(13,14,26,0.95);
    border-left: 1px solid rgba(99,102,241,0.15);
    padding: 20px 16px;
    display: flex; flex-direction: column; gap: 14px;
    position: relative; z-index: 1;
    backdrop-filter: blur(20px);
  }

  /* ── Panel section header ─────────────────────────────────────────── */
  .ss-sec-head { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
  .ss-sec-badge {
    width: 30px; height: 30px; border-radius: 9px;
    background: linear-gradient(140deg, #4f46e5, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 14px rgba(99,102,241,0.4);
    flex-shrink: 0; position: relative; overflow: hidden;
  }
  .ss-sec-badge::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%);
  }
  .ss-sec-title { font-size: 13px; font-weight: 700; color: #c4c8f0; letter-spacing: -.1px; }

  /* KPI cards */
  .ss-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ss-stat {
    background: rgba(22,24,44,0.9);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 16px; padding: 16px 12px; text-align: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    transition: all .2s;
  }
  .ss-stat:hover { border-color: rgba(99,102,241,0.35); box-shadow: 0 4px 20px rgba(99,102,241,0.15); }
  .ss-stat-num {
    font-size: 22px; font-weight: 800; letter-spacing: -1px; line-height: 1;
    background: linear-gradient(135deg, #818cf8, #a855f7);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .ss-stat-lbl { font-size: 10px; color: #3a3f6e; font-weight: 700; margin-top: 5px; text-transform: uppercase; letter-spacing: .6px; }

  /* Performance card */
  .ss-data-card {
    background: rgba(22,24,44,0.9);
    border-radius: 20px;
    border: 1px solid rgba(99,102,241,0.15);
    padding: 18px; overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    position: relative;
  }
  .ss-data-card::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:120px; height:120px; border-radius:50%;
    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
  }
  .ss-gpa-display {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px; padding-bottom: 14px;
    border-bottom: 1px solid rgba(99,102,241,0.1);
  }
  .ss-gpa-num {
    font-size: 42px; font-weight: 900; letter-spacing: -2px; line-height: 1;
    background: linear-gradient(135deg, #818cf8, #a855f7);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .ss-gpa-label { font-size: 10px; color: #3a3f6e; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; margin-top: 2px; }
  .ss-gpa-bar-wrap { margin-bottom: 4px; }
  .ss-gpa-bar-label { display: flex; justify-content: space-between; font-size: 10px; color: #3a3f6e; font-weight: 600; margin-bottom: 5px; font-family: 'Fira Code', monospace; }
  .ss-gpa-bar-bg { height: 6px; background: rgba(99,102,241,0.12); border-radius: 99px; overflow: hidden; }
  .ss-gpa-bar-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #4f46e5, #a855f7);
    box-shadow: 0 0 8px rgba(99,102,241,0.5);
    transition: width 1s cubic-bezier(.34,1.56,.64,1);
  }
  .ss-data-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid rgba(99,102,241,0.07);
    font-size: 12.5px;
  }
  .ss-data-row:last-child { border-bottom: none; padding-bottom: 0; }
  .ss-data-label { color: #3d4270; font-weight: 600; }
  .ss-data-value { font-weight: 700; color: #c4c8f0; }
  .ss-data-value.good { color: #4ade80; }
  .ss-data-value.warn { color: #fbbf24; }
  .ss-data-value.bad  { color: #f87171; }

  /* Subject badges in panel */
  .ss-subjects-list { display: flex; flex-direction: column; gap: 6px; }
  .ss-subject-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; border-radius: 10px;
    background: rgba(99,102,241,0.06);
    border: 1px solid rgba(99,102,241,0.1);
    font-size: 11.5px; gap: 8px;
  }
  .ss-subject-name { color: #8892b0; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ss-subject-score {
    font-weight: 700; font-size: 12px; padding: 2px 8px;
    border-radius: 20px; flex-shrink: 0;
  }
  .ss-subject-score.good { color: #4ade80; background: rgba(34,197,94,0.12); }
  .ss-subject-score.warn { color: #fbbf24; background: rgba(245,158,11,0.12); }
  .ss-subject-score.bad  { color: #f87171; background: rgba(239,68,68,0.12); }

  /* About card */
  .ss-about-card {
    background: rgba(22,24,44,0.9);
    border-radius: 20px; border: 1px solid rgba(99,102,241,0.15);
    padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .ss-about-desc { font-size: 12px; color: #3d4270; line-height: 1.65; margin-bottom: 16px; font-weight: 400; }
  .ss-flist { display: flex; flex-direction: column; gap: 8px; }
  .ss-frow { display: flex; align-items: center; gap: 10px; }
  .ss-fbox {
    width: 30px; height: 30px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 15px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.15);
  }
  .ss-flabel { font-size: 12.5px; font-weight: 600; color: #5d6494; }

  /* Quick prompts */
  .ss-prompts-card {
    background: rgba(22,24,44,0.9);
    border-radius: 20px; border: 1px solid rgba(99,102,241,0.15);
    padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .ss-qlist { display: flex; flex-direction: column; gap: 7px; }
  .ss-qbtn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 13px; border-radius: 12px;
    border: 1px solid rgba(99,102,241,0.12);
    background: rgba(99,102,241,0.06);
    font-size: 12.5px; font-weight: 600; color: #5d6494;
    cursor: pointer; text-align: left;
    font-family: 'Outfit', sans-serif;
    transition: all .18s;
  }
  .ss-qbtn:hover {
    background: rgba(99,102,241,0.14);
    border-color: rgba(99,102,241,0.3);
    color: #a5b4fc;
    transform: translateX(3px);
  }
  .ss-qbtn-txt { flex: 1; }

  /* Pro tip */
  .ss-protip {
    border-radius: 18px; padding: 16px 16px;
    background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%);
    border: 1px solid rgba(99,102,241,0.2);
    position: relative; overflow: hidden;
  }
  .ss-protip::before {
    content:''; position:absolute;
    top:-30px; right:-30px; width:90px; height:90px;
    border-radius:50%; background: rgba(99,102,241,0.1);
  }
  .ss-protip-txt { font-size: 12px; color: #5d6494; line-height: 1.65; font-weight: 500; position: relative; }
  .ss-protip-txt strong { color: #818cf8; }

  /* No data badge */
  .ss-no-data {
    text-align: center; padding: 24px 12px;
    color: #2e3258; font-size: 12px; font-weight: 600;
    font-family: 'Fira Code', monospace;
  }

  /* Loading shimmer skeleton */
  .ss-skeleton {
    height: 12px; border-radius: 6px;
    background: linear-gradient(90deg, rgba(99,102,241,0.08) 25%, rgba(99,102,241,0.15) 50%, rgba(99,102,241,0.08) 75%);
    background-size: 200% 100%;
    animation: ss-skeleton-wave 1.5s ease-in-out infinite;
    margin-bottom: 8px;
  }
  @keyframes ss-skeleton-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ════ SCROLLBAR ════════════════════════════════════════════════════ */
  .ss-feed::-webkit-scrollbar,
  .ss-panel::-webkit-scrollbar { width: 3px; }
  .ss-feed::-webkit-scrollbar-track,
  .ss-panel::-webkit-scrollbar-track { background: transparent; }
  .ss-feed::-webkit-scrollbar-thumb  { background: rgba(99,102,241,0.25); border-radius: 99px; }
  .ss-feed::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.45); }
  .ss-panel::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 99px; }

  /* ════ KEYFRAMES ════════════════════════════════════════════════════ */
  @keyframes ss-ripple   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.5);opacity:0} }
  @keyframes ss-breathe  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
  @keyframes ss-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ss-bounce   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
  @keyframes ss-slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  /* ════ RESPONSIVE ════════════════════════════════════════════════════ */
  @media(max-width:1100px) { .ss-panel { display:none } }
  @media(max-width:768px) {
    .ss-feed { padding:20px 16px 14px }
    .ss-input-wrap { padding:12px 16px 18px }
    .ss-bar { padding:0 16px; height:58px }
    .ss-bubble-user,.ss-bubble-ai { max-width:100% }
    .ss-user-meta,.ss-ai-meta { max-width:84% }
    .ss-empty-grid { grid-template-columns:1fr }
    .ss-student-bar { padding: 8px 16px }
  }
`;

/* ════════════════════ SVG ICONS ════════════════════ */
const Sparkle = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="white" style={{ position: 'relative', zIndex: 1 }}>
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
  </svg>
);
const SendIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 1 }}>
    <path d="M22 2L11 13" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white" />
  </svg>
);
const UserIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const ChevIco = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const PanelIco = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    {open
      ? <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></>
      : <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></>}
  </svg>
);

/* ════════════════════ CONSTANTS ════════════════════ */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FEATURES = [
  { emoji: '📈', label: 'Performance predictions' },
  { emoji: '📚', label: 'Personalised study tips' },
  { emoji: '⏱️', label: 'Time management advice' },
  { emoji: '🧠', label: 'Exam strategies' },
  { emoji: '⭐', label: 'Subject recommendations' },
];
const QUICK_ACTIONS = [
  'How can I improve my grades?',
  'Analyse my current performance',
  'What subjects need more focus?',
  'Tips to reduce study stress',
  'Predict my next exam score',
  'Create a personalised study plan',
];
const EMPTY_CARDS = [
  { emoji: '📊', label: 'Analyse my performance', sub: 'Full breakdown of your stats', val: 'Analyse my current academic performance in detail — include my GPA, subject scores, and where I stand.' },
  { emoji: '📈', label: 'Improve my GPA', sub: 'Targeted improvement strategies', val: 'Based on my actual GPA and subject scores, what specific steps can I take to improve?' },
  { emoji: '🎯', label: 'Predict my grade', sub: 'AI-powered score prediction', val: 'Based on my performance data and current scores, what grade am I likely to achieve?' },
  { emoji: '😌', label: 'Manage exam stress', sub: 'Calm nerves, boost confidence', val: 'How can I manage stress and stay confident before my exams?' },
];
const PILLS = ['Analyse my stats', 'Improve GPA', 'Predict grade', 'Study plan', 'Exam tips'];

/* ════════════════ GPA CALCULATION ══════════════════ */
// Grade-band GPA mapping — same as AnalyticsPage
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

/* ═════════════════ DATA LOADING ══════════════════════
   Priority order:
   1. sessionStorage 'analyticsScores' — set by UploadPage (richest, freshest)
   2. /api/analytics/student/:id      — MongoDB quiz scores
   3. /api/profile                    — profile subjectPerformance
   ═══════════════════════════════════════════════════ */
async function loadStudentData(user) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const studentId = user?.studentId || user?.id || user?._id;

  let averageScore = null;
  let subjects = [];    // [{ subject, score, grade }]
  let source = 'none';

  /* ── SOURCE 1: sessionStorage uploaded scores ─────── */
  try {
    const cached = sessionStorage.getItem('analyticsScores');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(r => r.subject && parseFloat(r.score) >= 0);
        if (valid.length > 0) {
          const vals = valid.map(r => parseFloat(r.score || 0));
          averageScore = vals.reduce((a, b) => a + b, 0) / vals.length;

          // Group by subject
          const bySubj = {};
          valid.forEach(r => {
            const s = r.subject.trim();
            if (!bySubj[s]) bySubj[s] = [];
            bySubj[s].push(parseFloat(r.score || 0));
          });
          subjects = Object.entries(bySubj).map(([subject, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            return { subject, score: parseFloat(avg.toFixed(1)), grade: getLetterGrade(avg) };
          }).sort((a, b) => b.score - a.score);
          source = 'upload';
        }
      }
    }
  } catch (e) { /* ignore */ }

  /* ── SOURCE 2: /api/analytics/student/:id ─────────── */
  const roleLc = String(user?.role || '').toLowerCase();
  if (averageScore === null && studentId && (roleLc === 'student' || roleLc === 'resource_admin_student')) {
    try {
      const res = await fetch(`${API_BASE}/analytics/student/${studentId}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const d = json?.data || json;
        // Handle various response shapes
        const subjArr = d?.subjects || d?.subjectPerformance || [];
        const recent  = d?.recentActivity || d?.overall?.recentScores || [];

        if (subjArr.length > 0) {
          subjects = subjArr.map(s => ({
            subject: s.subject || s.name,
            score:   parseFloat(s.statistics?.average ?? s.average ?? s.score ?? 0),
            grade:   s.grade || getLetterGrade(parseFloat(s.statistics?.average ?? s.average ?? s.score ?? 0)),
          })).filter(s => s.subject && s.score >= 0).sort((a, b) => b.score - a.score);
          if (subjects.length > 0) {
            averageScore = subjects.reduce((a, b) => a + b.score, 0) / subjects.length;
            source = 'analytics';
          }
        } else if (recent.length > 0) {
          const vals = recent.map(r => parseFloat(r.score || 0));
          averageScore = vals.reduce((a, b) => a + b, 0) / vals.length;
          source = 'analytics-recent';
        }
      }
    } catch (e) { /* ignore */ }
  }

  /* ── SOURCE 3: /api/profile ───────────────────────── */
  if (averageScore === null) {
    try {
      const res = await fetch(`${API_BASE}/profile`, { headers });
      if (res.ok) {
        const json = await res.json();
        const perf = json?.data?.performance || json?.performance;
        const subjPerf = perf?.subjectPerformance || [];
        if (subjPerf.length > 0) {
          subjects = subjPerf.map(s => ({
            subject: s.subject,
            score:   parseFloat(s.score ?? s.average ?? 0),
            grade:   s.grade || getLetterGrade(parseFloat(s.score ?? s.average ?? 0)),
          })).filter(s => s.subject).sort((a, b) => b.score - a.score);
          if (subjects.length > 0) {
            averageScore = subjects.reduce((a, b) => a + b.score, 0) / subjects.length;
            source = 'profile';
          }
        }
      }
    } catch (e) { /* ignore */ }
  }

  /* ── Derive final stats ───────────────────────────── */
  const avg = averageScore ?? 0;
  const gpa = scoreToGPA(avg);
  const grade = getLetterGrade(avg);
  const riskLevel = avg >= 75 ? 'LOW' : avg >= 50 ? 'MEDIUM' : 'HIGH';
  const passRate = subjects.length > 0
    ? Math.round((subjects.filter(s => s.score >= 50).length / subjects.length) * 100)
    : null;
  const topSubject = subjects[0] || null;
  const weakSubject = subjects.length > 1 ? subjects[subjects.length - 1] : null;

  return {
    name: user?.name || user?.username || 'Student',
    studentId: user?.studentId || '',
    averageScore: avg > 0 ? parseFloat(avg.toFixed(1)) : null,
    gpa: avg > 0 ? parseFloat(gpa.toFixed(2)) : null,
    grade: avg > 0 ? grade : null,
    riskLevel: avg > 0 ? riskLevel : null,
    passRate,
    subjects,        // full list for panel display
    topSubject,
    weakSubject,
    source,          // for debugging
    hasData: avg > 0 || subjects.length > 0,
  };
}

/* ═════════════════ BUILD CHATBOT CONTEXT ═════════════
   This rich context string is injected into every API
   call so the AI always knows the student's real data.
   ═══════════════════════════════════════════════════ */
function buildAIContext(studentData, user) {
  if (!studentData || !studentData.hasData) {
    return `Student: ${user?.name || 'Student'}. No academic data is uploaded yet — advise them to upload their marks on the Upload page first.`;
  }

  const subjectLines = studentData.subjects.slice(0, 10).map(s =>
    `  • ${s.subject}: ${s.score}% (${s.grade})`
  ).join('\n');

  return `
STUDENT PROFILE (real data — use these exact numbers in your response):
- Name: ${studentData.name}
- Current GPA: ${studentData.gpa !== null ? studentData.gpa.toFixed(2) + ' / 4.0' : 'Not available'}
- Overall Average Score: ${studentData.averageScore !== null ? studentData.averageScore + '%' : 'Not available'}
- Letter Grade: ${studentData.grade || 'Not available'}
- Risk Level: ${studentData.riskLevel || 'Unknown'}
- Pass Rate: ${studentData.passRate !== null ? studentData.passRate + '%' : 'Not available'}
- Best Subject: ${studentData.topSubject ? studentData.topSubject.subject + ' (' + studentData.topSubject.score + '%)' : 'None'}
- Weakest Subject: ${studentData.weakSubject ? studentData.weakSubject.subject + ' (' + studentData.weakSubject.score + '%)' : 'None'}

Subject Scores:
${subjectLines || '  No subject data yet.'}

INSTRUCTIONS: Always address the student by their first name. Always refer to their actual GPA (${studentData.gpa !== null ? studentData.gpa.toFixed(2) : 'N/A'}), average score (${studentData.averageScore !== null ? studentData.averageScore + '%' : 'N/A'}), and specific subject scores in your advice. Never use placeholder or example values. Give specific, actionable recommendations based on their actual weakest subject.
`.trim();
}

/* ═════════════════ API CALL ══════════════════════════ */
async function callChatbotAPI(message, user, conversationHistory, studentData) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const aiContext = buildAIContext(studentData, user);

  const response = await fetch(`${API_BASE}/chatbot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      studentId: user?.studentId || user?.id,
      history: conversationHistory.slice(-12).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      context: {
        studentName: user?.name || user?.username,
        studentId: user?.studentId || user?.id,
        // Pass all real student metrics so the backend can inject into the AI prompt
        gpa:           studentData?.gpa,
        averageScore:  studentData?.averageScore,
        grade:         studentData?.grade,
        riskLevel:     studentData?.riskLevel,
        passRate:      studentData?.passRate,
        topSubject:    studentData?.topSubject,
        weakSubject:   studentData?.weakSubject,
        subjects:      studentData?.subjects?.slice(0, 15),
        // Pre-built context string for backends that use it directly
        aiContextSummary: aiContext,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || errBody?.message || `Server error ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.message || data?.message || 'No response received.';
}

/* ══════════════════ SUB-COMPONENTS ══════════════════ */
const TypingIndicator = () => (
  <div className="ss-typing-row">
    <div className="ss-ai-ava"><Sparkle s={13} /></div>
    <div className="ss-typing-bubble">
      <div className="ss-tdot" /><div className="ss-tdot" /><div className="ss-tdot" />
    </div>
  </div>
);

const Bubble = ({ msg }) => {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (msg.role === 'user') return (
    <div className="ss-msg-row-user">
      <div className="ss-user-meta">
        <div className="ss-bubble-user">{msg.content}</div>
        <div className="ss-msg-ts ss-msg-ts-right">{time}</div>
      </div>
      <div className="ss-user-ava"><UserIco /></div>
    </div>
  );
  return (
    <div className="ss-msg-row-ai">
      <div className="ss-ai-ava"><Sparkle s={13} /></div>
      <div className="ss-ai-meta">
        <div className={msg.isError ? 'ss-bubble-error' : 'ss-bubble-ai'}>{msg.content}</div>
        <div className="ss-msg-ts">{time}</div>
      </div>
    </div>
  );
};

const EmptyState = ({ onSend }) => (
  <div className="ss-empty">
    <div className="ss-empty-ring">
      <div className="ss-empty-icon"><Sparkle s={32} /></div>
    </div>
    <h2 className="ss-empty-h">How can I help you today?</h2>
    <p className="ss-empty-p">Ask me anything about your studies — I have access to your real academic data.</p>
    <div className="ss-empty-grid">
      {EMPTY_CARDS.map((c, i) => (
        <button key={i} className="ss-empty-card" onClick={() => onSend(c.val)}>
          <span className="ss-empty-card-icon">{c.emoji}</span>
          <div className="ss-empty-card-label">{c.label}</div>
          <div className="ss-empty-card-sub">{c.sub}</div>
        </button>
      ))}
    </div>
  </div>
);

const StudentStatsBar = ({ studentData, loading }) => {
  if (loading) return (
    <div className="ss-student-bar">
      <span className="ss-sbar-label">Stats</span>
      <span className="ss-sstat ss-sstat-loading">⏳ Loading data...</span>
    </div>
  );
  if (!studentData?.hasData) return (
    <div className="ss-student-bar">
      <span className="ss-sbar-label">Stats</span>
      <span className="ss-sstat" style={{ color: '#3a3f6e' }}>📂 No marks uploaded yet</span>
    </div>
  );

  const riskClass = studentData.riskLevel === 'HIGH' ? 'risk-high'
    : studentData.riskLevel === 'MEDIUM' ? 'risk-med' : 'risk-low';
  const riskEmoji = studentData.riskLevel === 'HIGH' ? '🔴' : studentData.riskLevel === 'MEDIUM' ? '🟡' : '🟢';

  return (
    <div className="ss-student-bar">
      <span className="ss-sbar-label">Live Stats</span>
      {studentData.gpa != null && (
        <span className="ss-sstat">📊 GPA {studentData.gpa.toFixed(2)}</span>
      )}
      {studentData.averageScore != null && (
        <span className="ss-sstat">🎯 Avg {studentData.averageScore}%</span>
      )}
      {studentData.grade && (
        <span className="ss-sstat">🏅 Grade {studentData.grade}</span>
      )}
      {studentData.passRate != null && (
        <span className="ss-sstat">✅ Pass {studentData.passRate}%</span>
      )}
      {studentData.riskLevel && (
        <span className={`ss-sstat ${riskClass}`}>{riskEmoji} {studentData.riskLevel} Risk</span>
      )}
    </div>
  );
};

const GpaBar = ({ gpa }) => {
  const pct = Math.min(100, (gpa / 4.0) * 100);
  return (
    <div className="ss-gpa-bar-wrap">
      <div className="ss-gpa-bar-label">
        <span>0.0</span><span>2.0</span><span>4.0</span>
      </div>
      <div className="ss-gpa-bar-bg">
        <div className="ss-gpa-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const RightPanel = ({ onSend, studentData, loading }) => {
  const gpaColor = !studentData?.gpa ? '' : studentData.gpa >= 3.0 ? 'good' : studentData.gpa >= 2.0 ? 'warn' : 'bad';

  return (
    <>
      <div className="ss-stats">
        <div className="ss-stat">
          <div className="ss-stat-num">AI</div>
          <div className="ss-stat-lbl">Powered</div>
        </div>
        <div className="ss-stat">
          <div className="ss-stat-num">24/7</div>
          <div className="ss-stat-lbl">Available</div>
        </div>
      </div>

      {/* ── Live performance card ───────────────────── */}
      <div className="ss-data-card">
        <div className="ss-sec-head">
          <span style={{ fontSize: 18 }}>📊</span>
          <span className="ss-sec-title">Your Performance</span>
        </div>

        {loading ? (
          <><div className="ss-skeleton" style={{ width: '60%' }} />
            <div className="ss-skeleton" style={{ width: '80%' }} />
            <div className="ss-skeleton" style={{ width: '45%' }} /></>
        ) : !studentData?.hasData ? (
          <div className="ss-no-data">
            No marks uploaded yet.<br />
            <a href="/upload" style={{ color: '#4f46e5', textDecoration: 'none' }}>Upload your marks →</a>
          </div>
        ) : (
          <>
            {/* Big GPA display */}
            {studentData.gpa != null && (
              <div className="ss-gpa-display">
                <div>
                  <div className="ss-gpa-num">{studentData.gpa.toFixed(2)}</div>
                  <div className="ss-gpa-label">Current GPA / 4.0</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: studentData.gpa >= 3.0 ? '#4ade80' : studentData.gpa >= 2.0 ? '#fbbf24' : '#f87171' }}>
                    {studentData.grade}
                  </div>
                  <div style={{ fontSize: 10, color: '#3a3f6e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Grade</div>
                </div>
              </div>
            )}
            {studentData.gpa != null && <GpaBar gpa={studentData.gpa} />}

            <div style={{ marginTop: 14 }}>
              {studentData.averageScore != null && (
                <div className="ss-data-row">
                  <span className="ss-data-label">Average Score</span>
                  <span className={`ss-data-value ${studentData.averageScore >= 75 ? 'good' : studentData.averageScore >= 50 ? 'warn' : 'bad'}`}>
                    {studentData.averageScore}%
                  </span>
                </div>
              )}
              {studentData.passRate != null && (
                <div className="ss-data-row">
                  <span className="ss-data-label">Pass Rate</span>
                  <span className={`ss-data-value ${studentData.passRate >= 75 ? 'good' : studentData.passRate >= 50 ? 'warn' : 'bad'}`}>
                    {studentData.passRate}%
                  </span>
                </div>
              )}
              {studentData.riskLevel && (
                <div className="ss-data-row">
                  <span className="ss-data-label">Risk Level</span>
                  <span className={`ss-data-value ${studentData.riskLevel === 'HIGH' ? 'bad' : studentData.riskLevel === 'MEDIUM' ? 'warn' : 'good'}`}>
                    {studentData.riskLevel}
                  </span>
                </div>
              )}
              {studentData.topSubject && (
                <div className="ss-data-row">
                  <span className="ss-data-label">Best Subject</span>
                  <span className="ss-data-value good" style={{ fontSize: 11, maxWidth: 120, textAlign: 'right', lineHeight: 1.3 }}>
                    {studentData.topSubject.subject.split(' - ')[0]}
                  </span>
                </div>
              )}
              {studentData.weakSubject && (
                <div className="ss-data-row">
                  <span className="ss-data-label">Needs Focus</span>
                  <span className="ss-data-value bad" style={{ fontSize: 11, maxWidth: 120, textAlign: 'right', lineHeight: 1.3 }}>
                    {studentData.weakSubject.subject.split(' - ')[0]}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Subject scores list ─────────────────────── */}
      {studentData?.subjects?.length > 0 && (
        <div className="ss-data-card">
          <div className="ss-sec-head">
            <span style={{ fontSize: 18 }}>📚</span>
            <span className="ss-sec-title">Subject Scores</span>
          </div>
          <div className="ss-subjects-list">
            {studentData.subjects.slice(0, 8).map((s, i) => (
              <div key={i} className="ss-subject-row">
                <span className="ss-subject-name" title={s.subject}>{s.subject.split(' - ')[0] || s.subject}</span>
                <span className={`ss-subject-score ${s.score >= 75 ? 'good' : s.score >= 50 ? 'warn' : 'bad'}`}>
                  {s.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── About card ──────────────────────────────── */}
      <div className="ss-about-card">
        <div className="ss-sec-head">
          <div className="ss-sec-badge"><Sparkle s={13} /></div>
          <span className="ss-sec-title">StudySmart AI</span>
        </div>
        <p className="ss-about-desc">
          Your intelligent study companion — powered by your real performance data to deliver personalised, data-driven academic guidance.
        </p>
        <div className="ss-flist">
          {FEATURES.map((f, i) => (
            <div key={i} className="ss-frow">
              <div className="ss-fbox">{f.emoji}</div>
              <span className="ss-flabel">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick prompts ───────────────────────────── */}
      <div className="ss-prompts-card">
        <div className="ss-sec-head">
          <span style={{ fontSize: 18 }}>⚡</span>
          <span className="ss-sec-title">Quick prompts</span>
        </div>
        <div className="ss-qlist">
          {QUICK_ACTIONS.map((q, i) => (
            <button key={i} className="ss-qbtn" onClick={() => onSend(q)}>
              <span className="ss-qbtn-txt">{q}</span>
              <ChevIco />
            </button>
          ))}
        </div>
      </div>

      <div className="ss-protip">
        <p className="ss-protip-txt">
          💡 <strong>Pro tip:</strong> Ask me to "analyse my performance" for a detailed breakdown of your strengths, weaknesses, and a personalised improvement plan.
        </p>
      </div>
    </>
  );
};

/* ════════════════════ MAIN PAGE ════════════════════ */
const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [showPanel,    setShowPanel]    = useState(true);
  const [studentData,  setStudentData]  = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);
  const feedEnd  = useRef(null);
  const taRef    = useRef(null);
  const sending  = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Fetch real student data from all sources ──────
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    loadStudentData(user)
      .then(data => {
        setStudentData(data);
        console.debug('[ChatbotPage] studentData loaded:', data);
      })
      .catch(err => {
        console.error('[ChatbotPage] loadStudentData failed:', err);
        setStudentData({ hasData: false, name: user?.name || 'Student', subjects: [] });
      })
      .finally(() => setDataLoading(false));
  }, [user]);

  const autoGrow = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  };

  const doSend = useCallback(async (text) => {
    const content = typeof text === 'string' ? text.trim() : input.trim();
    if (!content || isTyping || sending.current) return;
    sending.current = true;

    const userMsg = {
      role: 'user', content,
      timestamp: new Date().toISOString(),
      id: `u-${Date.now()}`,
    };
    const historySnapshot = [...messages];
    setMessages(p => [...p, userMsg]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
      const reply = await callChatbotAPI(content, user, historySnapshot, studentData);
      setMessages(p => [...p, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        id: `a-${Date.now()}`,
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(p => [...p, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date().toISOString(),
        id: `err-${Date.now()}`,
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
      sending.current = false;
    }
  }, [input, isTyping, messages, user, studentData]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  };
  const handleChange = (e) => { setInput(e.target.value); autoGrow(e.target); };

  const hasMsg = messages.length > 0;
  const today  = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="ss-root">

        {/* ════ CHAT COLUMN ════════════════════════════ */}
        <div className="ss-col">

          {/* Top bar */}
          <div className="ss-bar">
            <div className="ss-bar-left">
              <div className="ss-ai-badge"><Sparkle s={18} /></div>
              <div>
                <div className="ss-bar-name">StudySmart AI</div>
                <div className="ss-bar-status">
                  <div className="ss-pulse-dot" />
                  <span className="ss-status-txt">
                    online · powered by gemini
                    {studentData?.hasData && ` · ${studentData.subjects.length} subjects loaded`}
                  </span>
                </div>
              </div>
            </div>
            <button className="ss-panel-btn" onClick={() => setShowPanel(p => !p)}>
              <PanelIco open={showPanel} />
              {showPanel ? 'Hide panel' : 'Show panel'}
            </button>
          </div>

          {/* Student stats bar */}
          <StudentStatsBar studentData={studentData} loading={dataLoading} />

          {/* Feed */}
          <div className="ss-feed">
            {!hasMsg ? (
              <EmptyState onSend={doSend} />
            ) : (
              <div className="ss-feed-inner">
                <div className="ss-divider">{today}</div>
                {messages.map(m => <Bubble key={m.id} msg={m} />)}
                {isTyping && <TypingIndicator />}
                <div ref={feedEnd} style={{ height: 8 }} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="ss-input-wrap">
            {hasMsg && (
              <div className="ss-pills">
                {PILLS.map((p, i) => (
                  <button key={i} className="ss-pill" onClick={() => doSend(p)}>{p}</button>
                ))}
              </div>
            )}
            <div className="ss-inputbox">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your studies..."
                className="ss-ta"
              />
              <button
                className="ss-send"
                onClick={() => doSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <SendIco />
              </button>
            </div>
            <p className="ss-footer-hint">
              <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift + Enter</kbd> for new line
            </p>
          </div>
        </div>

        {/* ════ RIGHT PANEL ════════════════════════════ */}
        {showPanel && (
          <div className="ss-panel">
            <RightPanel onSend={doSend} studentData={studentData} loading={dataLoading} />
          </div>
        )}
      </div>
    </>
  );
};

export default ChatbotPage;