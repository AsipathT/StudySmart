import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

/* ════════════════════════════════════════════════════════════════════
   SCOPED CSS — zero dependency on Tailwind or Ant Design
   ════════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .ss-root *, .ss-root *::before, .ss-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .ss-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex;
    height: calc(100vh - 64px);
    background: #f0f2f8;
    overflow: hidden;
    position: relative;
  }

  /* ════ CHAT COLUMN ════════════════════════════════ */
  .ss-col {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
    height: 100%;
  }

  /* ── Top bar ──────────────────────────────────── */
  .ss-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 62px;
    background: #ffffff;
    border-bottom: 1px solid rgba(99,102,241,0.1);
    flex-shrink: 0;
    box-shadow: 0 1px 0 #eceef6, 0 4px 16px rgba(0,0,0,0.03);
  }
  .ss-bar-left { display: flex; align-items: center; gap: 13px; }
  .ss-ai-badge {
    width: 40px; height: 40px; border-radius: 14px;
    background: linear-gradient(140deg, #6366f1 0%, #a855f7 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
    flex-shrink: 0; position: relative; overflow: hidden;
  }
  .ss-ai-badge::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    border-radius: inherit;
  }
  .ss-bar-name { font-size: 15px; font-weight: 700; color: #12131f; letter-spacing: -.35px; line-height: 1; }
  .ss-bar-status { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
  .ss-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; position: relative;
  }
  .ss-pulse-dot::after {
    content:''; position:absolute; inset:-2px; border-radius:50%;
    background: rgba(34,197,94,0.3);
    animation: ss-ripple 2s ease-out infinite;
  }
  .ss-status-txt { font-size: 11.5px; color: #96a0be; font-weight: 500; }
  .ss-panel-btn {
    display: flex; align-items: center; gap: 6px;
    font-size: 12.5px; font-weight: 600; color: #6366f1;
    padding: 7px 14px; border-radius: 10px;
    border: 1.5px solid rgba(99,102,241,0.2);
    background: rgba(99,102,241,0.05);
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .18s;
  }
  .ss-panel-btn:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.4); }

  /* ── Message feed ─────────────────────────────── */
  .ss-feed {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 28px 28px 16px;
    display: flex; flex-direction: column;
    background: #f0f2f8;
  }
  .ss-feed-inner { max-width: 700px; width: 100%; margin: 0 auto; }

  /* Date divider */
  .ss-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 8px 0 20px; color: #adb5cf; font-size: 11.5px; font-weight: 600;
    letter-spacing: .4px; text-transform: uppercase;
  }
  .ss-divider::before, .ss-divider::after {
    content:''; flex:1; height:1px; background: rgba(0,0,0,0.07);
  }

  /* User message */
  .ss-msg-row-user {
    display: flex; align-items: flex-end;
    justify-content: flex-end;
    gap: 9px; margin-bottom: 6px;
    animation: ss-slide-up .2s cubic-bezier(.22,.68,0,1.2);
  }
  .ss-user-meta { display: flex; flex-direction: column; align-items: flex-end; max-width: 68%; }
  .ss-bubble-user {
    background: linear-gradient(140deg, #6366f1 0%, #8b5cf6 100%);
    color: #fff; font-size: 14px; line-height: 1.6; font-weight: 500;
    padding: 11px 16px; border-radius: 20px 20px 5px 20px;
    word-break: break-word; white-space: pre-wrap;
    min-width: 44px; width: fit-content; max-width: 100%;
    box-shadow: 0 4px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
    position: relative;
  }
  .ss-user-ava {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(135deg, #1e2035, #2d3050);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  /* AI message */
  .ss-msg-row-ai {
    display: flex; align-items: flex-end;
    gap: 9px; margin-bottom: 6px;
    animation: ss-slide-up .2s cubic-bezier(.22,.68,0,1.2);
  }
  .ss-ai-meta { display: flex; flex-direction: column; max-width: 72%; }
  .ss-bubble-ai {
    background: #ffffff; color: #1a1c2e;
    font-size: 14px; line-height: 1.75; font-weight: 400;
    padding: 14px 18px; border-radius: 5px 20px 20px 20px;
    word-break: break-word; white-space: pre-wrap;
    min-width: 44px; width: fit-content; max-width: 100%;
    border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  }
  .ss-ai-ava {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(140deg, #6366f1, #a855f7);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 3px 12px rgba(99,102,241,0.35);
    position: relative; overflow: hidden;
  }
  .ss-ai-ava::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%);
  }
  .ss-msg-ts {
    font-size: 10.5px; color: #b4bcd4; margin-top: 4px;
    font-family: 'JetBrains Mono', monospace; font-weight: 400;
    padding: 0 4px;
  }
  .ss-msg-ts-right { text-align: right; }

  /* ── Error bubble ─────────────────────────────── */
  .ss-bubble-error {
    background: #fff1f2; color: #be123c;
    font-size: 13px; line-height: 1.6; font-weight: 500;
    padding: 11px 16px; border-radius: 5px 20px 20px 20px;
    word-break: break-word; white-space: pre-wrap;
    min-width: 44px; width: fit-content; max-width: 100%;
    border: 1px solid rgba(190,18,60,0.15);
  }

  /* ── Typing indicator ─────────────────────────── */
  .ss-typing-row { display: flex; align-items: flex-end; gap: 9px; margin-bottom: 6px; }
  .ss-typing-bubble {
    background: #fff; border: 1px solid rgba(0,0,0,0.06);
    border-radius: 5px 20px 20px 20px;
    padding: 14px 18px;
    display: inline-flex; align-items: center; gap: 5px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .ss-tdot {
    width: 7px; height: 7px; border-radius: 50%;
    animation: ss-bounce 1.4s ease-in-out infinite;
  }
  .ss-tdot:nth-child(1) { background: #c7d2fe; animation-delay: 0s; }
  .ss-tdot:nth-child(2) { background: #a5b4fc; animation-delay: .18s; }
  .ss-tdot:nth-child(3) { background: #818cf8; animation-delay: .36s; }

  /* ── Empty state ──────────────────────────────── */
  .ss-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 24px; text-align: center; min-height: 100%;
  }
  .ss-empty-ring { position: relative; margin-bottom: 28px; }
  .ss-empty-ring::before {
    content:''; position:absolute;
    inset: -18px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
    animation: ss-breathe 3s ease-in-out infinite;
  }
  .ss-empty-ring::after {
    content:''; position:absolute;
    inset: -8px; border-radius: 50%;
    border: 1.5px dashed rgba(99,102,241,0.2);
    animation: ss-spin 20s linear infinite;
  }
  .ss-empty-icon {
    position: relative; width: 72px; height: 72px; border-radius: 24px;
    background: linear-gradient(140deg, #6366f1 0%, #a855f7 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 36px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .ss-empty-h { font-size: 26px; font-weight: 800; color: #12131f; letter-spacing: -.6px; margin-bottom: 10px; }
  .ss-empty-p { font-size: 14px; color: #7d87a4; max-width: 300px; line-height: 1.65; margin-bottom: 32px; }
  .ss-empty-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 420px; }
  .ss-empty-card {
    padding: 14px 16px; border-radius: 16px;
    background: #fff; border: 1.5px solid #e8eaf4;
    text-align: left; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .2s; position: relative; overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .ss-empty-card::before {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 100%);
    opacity: 0; transition: opacity .2s;
  }
  .ss-empty-card:hover { border-color: #a5b4fc; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.14); }
  .ss-empty-card:hover::before { opacity: 1; }
  .ss-empty-card-icon { font-size: 20px; margin-bottom: 8px; display: block; }
  .ss-empty-card-label { font-size: 12.5px; font-weight: 600; color: #2a2d44; line-height: 1.4; }
  .ss-empty-card-sub { font-size: 11.5px; color: #9aa0bc; margin-top: 2px; line-height: 1.4; }

  /* ── Input area ───────────────────────────────── */
  .ss-input-wrap {
    flex-shrink: 0; background: #f0f2f8;
    padding: 12px 28px 18px;
  }
  .ss-pills {
    display: flex; flex-wrap: wrap; gap: 7px;
    max-width: 700px; margin: 0 auto 10px;
  }
  .ss-pill {
    padding: 5px 14px; border-radius: 20px;
    background: rgba(255,255,255,0.85); border: 1px solid #dde0f0;
    font-size: 12px; font-weight: 600; color: #6066a0;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .15s; backdrop-filter: blur(4px);
  }
  .ss-pill:hover { background: #fff; border-color: #a5b4fc; color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,0.12); }
  .ss-inputbox {
    display: flex; align-items: flex-end; gap: 10px;
    background: #ffffff; border: 1.5px solid #e4e6f2;
    border-radius: 18px; padding: 10px 10px 10px 18px;
    transition: border-color .2s, box-shadow .2s;
    max-width: 700px; margin: 0 auto;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .ss-inputbox:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99,102,241,0.12), 0 2px 12px rgba(0,0,0,0.06);
  }
  .ss-ta {
    flex: 1; border: none; background: transparent; outline: none;
    font-size: 14px; font-weight: 500; color: #1a1c2e;
    resize: none; line-height: 1.56;
    min-height: 24px; max-height: 128px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ss-ta::placeholder { color: #c0c8de; font-weight: 400; }
  .ss-send {
    width: 38px; height: 38px; border-radius: 12px; border: none;
    background: linear-gradient(140deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99,102,241,0.4);
    transition: transform .15s, box-shadow .15s, opacity .15s;
  }
  .ss-send:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }
  .ss-send:active:not(:disabled) { transform: scale(.92); }
  .ss-send:disabled { opacity: .32; cursor: not-allowed; box-shadow: none; }
  .ss-footer-hint {
    text-align: center; font-size: 11px; color: #bcc4d8; margin-top: 8px;
    font-family: 'JetBrains Mono', monospace;
  }
  .ss-footer-hint kbd {
    background: #fff; border: 1px solid #dde0f0; border-radius: 5px;
    padding: 1px 6px; font-size: 10.5px; color: #8890b0;
    box-shadow: 0 1px 0 #d0d4e8;
  }

  /* ── Student stats bar ────────────────────────── */
  .ss-student-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 28px; background: #fff;
    border-bottom: 1px solid rgba(99,102,241,0.08);
    font-size: 12px; font-weight: 600;
    flex-wrap: wrap;
  }
  .ss-sstat {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px;
    background: #f5f3ff; color: #6366f1;
    border: 1px solid rgba(99,102,241,0.15);
  }
  .ss-sstat.risk-high { background: #fff1f2; color: #be123c; border-color: rgba(190,18,60,0.15); }
  .ss-sstat.risk-medium { background: #fffbeb; color: #b45309; border-color: rgba(180,83,9,0.15); }
  .ss-sstat.risk-low { background: #f0fdf4; color: #15803d; border-color: rgba(21,128,61,0.15); }

  /* ════ RIGHT PANEL ════════════════════════════════ */
  .ss-panel {
    width: 296px; flex-shrink: 0; height: 100%;
    overflow-y: auto; overflow-x: hidden;
    background: #f7f8fd;
    border-left: 1px solid rgba(99,102,241,0.1);
    padding: 20px 16px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .ss-sec-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .ss-sec-badge {
    width: 30px; height: 30px; border-radius: 9px;
    background: linear-gradient(140deg, #6366f1, #a855f7);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 10px rgba(99,102,241,0.32);
    flex-shrink: 0; position: relative; overflow: hidden;
  }
  .ss-sec-badge::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%);
  }
  .ss-sec-title { font-size: 13.5px; font-weight: 700; color: #14152a; letter-spacing: -.2px; }
  .ss-about-card {
    background: #fff; border-radius: 18px;
    border: 1px solid rgba(99,102,241,0.1);
    padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .ss-about-desc { font-size: 12px; color: #8892b0; line-height: 1.6; margin-bottom: 16px; font-weight: 400; }
  .ss-flist { display: flex; flex-direction: column; gap: 7px; }
  .ss-frow { display: flex; align-items: center; gap: 10px; }
  .ss-fbox {
    width: 30px; height: 30px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 15px;
  }
  .ss-flabel { font-size: 12.5px; font-weight: 600; color: #3a3f5c; }

  /* Student data card in panel */
  .ss-data-card {
    background: #fff; border-radius: 18px;
    border: 1px solid rgba(99,102,241,0.1);
    padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .ss-data-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 0; border-bottom: 1px solid #f0f2f8;
    font-size: 12.5px;
  }
  .ss-data-row:last-child { border-bottom: none; }
  .ss-data-label { color: #8892b0; font-weight: 500; }
  .ss-data-value { font-weight: 700; color: #1a1c2e; }
  .ss-data-value.good { color: #15803d; }
  .ss-data-value.warn { color: #b45309; }
  .ss-data-value.bad  { color: #be123c; }

  .ss-prompts-card {
    background: #fff; border-radius: 18px;
    border: 1px solid rgba(99,102,241,0.1);
    padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .ss-qlist { display: flex; flex-direction: column; gap: 7px; }
  .ss-qbtn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 13px; border-radius: 11px;
    border: 1px solid #eceef8; background: #f7f8fd;
    font-size: 12.5px; font-weight: 600; color: #3a3f5c;
    cursor: pointer; text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .16s;
  }
  .ss-qbtn:hover { background: #eeeeff; border-color: #c4b5fd; color: #6366f1; transform: translateX(2px); }
  .ss-qbtn-txt { flex: 1; }
  .ss-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ss-stat {
    background: #fff; border-radius: 14px;
    border: 1px solid rgba(99,102,241,0.1);
    padding: 14px 12px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .ss-stat-num { font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: -1px; line-height: 1; }
  .ss-stat-lbl { font-size: 10.5px; color: #96a0be; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: .4px; }
  .ss-protip {
    border-radius: 16px; padding: 15px 16px;
    background: linear-gradient(135deg, #f0f0fe 0%, #ede9ff 100%);
    border: 1.5px solid rgba(99,102,241,0.15);
    position: relative; overflow: hidden;
  }
  .ss-protip::before {
    content:''; position:absolute;
    top:-20px; right:-20px; width:80px; height:80px;
    border-radius:50%; background: rgba(99,102,241,0.07);
  }
  .ss-protip-txt { font-size: 12px; color: #5254a3; line-height: 1.65; font-weight: 500; position: relative; }

  /* ════ SCROLLBAR ══════════════════════════════════ */
  .ss-feed::-webkit-scrollbar,
  .ss-panel::-webkit-scrollbar { width: 3px; }
  .ss-feed::-webkit-scrollbar-track,
  .ss-panel::-webkit-scrollbar-track { background: transparent; }
  .ss-feed::-webkit-scrollbar-thumb { background: #d0d4e8; border-radius: 99px; }
  .ss-feed::-webkit-scrollbar-thumb:hover { background: #a5b4fc; }
  .ss-panel::-webkit-scrollbar-thumb { background: #dde0f0; border-radius: 99px; }

  /* ════ KEYFRAMES ══════════════════════════════════ */
  @keyframes ss-ripple   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
  @keyframes ss-breathe  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }
  @keyframes ss-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ss-bounce   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-7px)} }
  @keyframes ss-slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  /* ════ RESPONSIVE ═════════════════════════════════ */
  @media(max-width:1100px) { .ss-panel { display:none } }
  @media(max-width:768px) {
    .ss-feed { padding:16px 14px 12px }
    .ss-input-wrap { padding:10px 14px 16px }
    .ss-bar { padding:0 16px; height:56px }
    .ss-bubble-user,.ss-bubble-ai { max-width:100% }
    .ss-user-meta,.ss-ai-meta { max-width:82% }
    .ss-empty-grid { grid-template-columns:1fr }
    .ss-student-bar { padding: 8px 16px; }
  }
`;

/* ════════════════════ SVG ICONS ════════════════════ */
const Sparkle = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="white" style={{ position:'relative', zIndex:1 }}>
    <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
  </svg>
);
const SendIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white"/>
  </svg>
);
const UserIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const ChevIco = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const PanelIco = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    {open
      ? <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></>
      : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9"  y1="3" x2="9"  y2="21"/></>
    }
  </svg>
);

/* ════════════════════ DATA ═════════════════════════ */
const FEATURES = [
  { emoji:'📈', label:'Performance predictions', bg:'#f0fdf4' },
  { emoji:'📚', label:'Personalised study tips',  bg:'#f5f3ff' },
  { emoji:'⏱️', label:'Time management advice',   bg:'#eff6ff' },
  { emoji:'🧠', label:'Exam strategies',          bg:'#fff7ed' },
  { emoji:'⭐', label:'Subject recommendations',  bg:'#fefce8' },
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
  { emoji:'📊', label:'Analyse my performance',   sub:'Get a full breakdown of your stats',   val:'Analyse my current academic performance and tell me where I stand' },
  { emoji:'📈', label:'Improve my GPA',           sub:'Targeted improvement strategies',       val:'What specific steps can I take to improve my GPA based on my current data?' },
  { emoji:'🎯', label:'Predict my grade',         sub:'AI-powered score prediction',           val:'Based on my performance data, what grade am I likely to get next?' },
  { emoji:'😌', label:'Manage exam stress',       sub:'Calm nerves, boost confidence',         val:'How can I manage stress and anxiety before exams?' },
];
const PILLS = ['Analyse my stats', 'Improve GPA', 'Predict grade', 'Study plan', 'Exam prep'];

/* ════════════════════ API CALL ═════════════════════ */
// ── Adjust BASE_URL to match your backend ──────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function callChatbotAPI(message, user, conversationHistory) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const response = await fetch(`${API_BASE}/chatbot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      studentId: user?.studentId || user?.id,
      // Pass conversation history so backend can give contextual responses
      history: conversationHistory.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      // Pass any client-side context we already have
      context: {
        studentName: user?.name || user?.username,
        studentId:   user?.studentId || user?.id,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Server error ${response.status}`);
  }

  const data = await response.json();
  // Support both response shapes: data.data.message or data.message
  return data?.data?.message || data?.message || 'No response received.';
}

/* ════════════════════ SUB-COMPONENTS ══════════════ */
const TypingIndicator = () => (
  <div className="ss-typing-row">
    <div className="ss-ai-ava"><Sparkle s={13} /></div>
    <div className="ss-typing-bubble">
      <div className="ss-tdot"/><div className="ss-tdot"/><div className="ss-tdot"/>
    </div>
  </div>
);

const Bubble = ({ msg }) => {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
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
      <div className="ss-empty-icon"><Sparkle s={30} /></div>
    </div>
    <h2 className="ss-empty-h">How can I help you today?</h2>
    <p className="ss-empty-p">Ask me anything about your studies, performance insights, or exam preparation.</p>
    <div className="ss-empty-grid">
      {EMPTY_CARDS.map((c,i) => (
        <button key={i} className="ss-empty-card" onClick={() => onSend(c.val)}>
          <span className="ss-empty-card-icon">{c.emoji}</span>
          <div className="ss-empty-card-label">{c.label}</div>
          <div className="ss-empty-card-sub">{c.sub}</div>
        </button>
      ))}
    </div>
  </div>
);

const StudentStatsBar = ({ studentData }) => {
  if (!studentData) return null;
  const riskClass = studentData.riskLevel === 'HIGH' ? 'risk-high'
    : studentData.riskLevel === 'MEDIUM' ? 'risk-medium' : 'risk-low';
  const riskEmoji = studentData.riskLevel === 'HIGH' ? '🔴'
    : studentData.riskLevel === 'MEDIUM' ? '🟡' : '🟢';
  return (
    <div className="ss-student-bar">
      <span style={{ fontSize:12, color:'#8892b0', fontWeight:600 }}>Your stats:</span>
      {studentData.gpa != null && (
        <span className="ss-sstat">📊 GPA: {Number(studentData.gpa).toFixed(2)}</span>
      )}
      {studentData.averageScore != null && (
        <span className="ss-sstat">🎯 Avg: {Number(studentData.averageScore).toFixed(1)}%</span>
      )}
      {studentData.attendance != null && (
        <span className="ss-sstat">📅 Attendance: {studentData.attendance}%</span>
      )}
      {studentData.riskLevel && (
        <span className={`ss-sstat ${riskClass}`}>{riskEmoji} {studentData.riskLevel} Risk</span>
      )}
    </div>
  );
};

const RightPanel = ({ onSend, studentData }) => {
  const gpaColor = !studentData?.gpa ? '' : studentData.gpa >= 3.0 ? 'good' : studentData.gpa >= 2.0 ? 'warn' : 'bad';
  const attColor = !studentData?.attendance ? '' : studentData.attendance >= 80 ? 'good' : studentData.attendance >= 60 ? 'warn' : 'bad';
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

      {/* Live student data */}
      {studentData && (
        <div className="ss-data-card">
          <div className="ss-sec-head">
            <span style={{ fontSize:18 }}>📊</span>
            <span className="ss-sec-title">Your Performance</span>
          </div>
          <div className="ss-data-row">
            <span className="ss-data-label">GPA</span>
            <span className={`ss-data-value ${gpaColor}`}>{studentData.gpa != null ? Number(studentData.gpa).toFixed(2) : '—'}</span>
          </div>
          <div className="ss-data-row">
            <span className="ss-data-label">Average Score</span>
            <span className="ss-data-value">{studentData.averageScore != null ? `${Number(studentData.averageScore).toFixed(1)}%` : '—'}</span>
          </div>
          <div className="ss-data-row">
            <span className="ss-data-label">Attendance</span>
            <span className={`ss-data-value ${attColor}`}>{studentData.attendance != null ? `${studentData.attendance}%` : '—'}</span>
          </div>
          {studentData.totalAssignments != null && (
            <div className="ss-data-row">
              <span className="ss-data-label">Assignments</span>
              <span className="ss-data-value">{studentData.completedAssignments || 0}/{studentData.totalAssignments}</span>
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
          {studentData.predictedGrade && (
            <div className="ss-data-row">
              <span className="ss-data-label">Predicted Grade</span>
              <span className="ss-data-value good">{studentData.predictedGrade}</span>
            </div>
          )}
        </div>
      )}

      <div className="ss-about-card">
        <div className="ss-sec-head">
          <div className="ss-sec-badge"><Sparkle s={13} /></div>
          <span className="ss-sec-title">StudySmart AI</span>
        </div>
        <p className="ss-about-desc">
          Your intelligent study companion — powered by your real performance data to deliver personalised, adaptive academic guidance.
        </p>
        <div className="ss-flist">
          {FEATURES.map((f,i) => (
            <div key={i} className="ss-frow">
              <div className="ss-fbox" style={{ background: f.bg }}>{f.emoji}</div>
              <span className="ss-flabel">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ss-prompts-card">
        <div className="ss-sec-head">
          <span style={{ fontSize:18 }}>⚡</span>
          <span className="ss-sec-title">Quick prompts</span>
        </div>
        <div className="ss-qlist">
          {QUICK_ACTIONS.map((q,i) => (
            <button key={i} className="ss-qbtn" onClick={() => onSend(q)}>
              <span className="ss-qbtn-txt">{q}</span>
              <ChevIco />
            </button>
          ))}
        </div>
      </div>

      <div className="ss-protip">
        <p className="ss-protip-txt">
          💡 <strong>Pro tip:</strong> Ask me to "analyse my performance" for a full breakdown of your strengths and weaknesses.
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
  const feedEnd  = useRef(null);
  const taRef    = useRef(null);
  const sending  = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, isTyping]);

  // Fetch student analytics to show in panel and pass to API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentId = user?.studentId || user?.id;
        if (!studentId) return;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE}/analytics/student/${studentId}`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          // Normalise whatever shape your analytics endpoint returns
          const analytics = data?.data || data;
          const avg = analytics?.statistics?.average || analytics?.averageScore || 0;
          const gpa = Math.max(0, ((avg - 40) / 60) * 4.0);
          const riskLevel = avg >= 75 ? 'LOW' : avg >= 50 ? 'MEDIUM' : 'HIGH';
          setStudentData({
            name:                 user?.name || user?.username || 'Student',
            averageScore:         avg,
            gpa:                  gpa.toFixed(2),
            attendance:           analytics?.attendance || analytics?.attendanceRate || null,
            completedAssignments: analytics?.completedAssignments || null,
            totalAssignments:     analytics?.totalAssignments || null,
            riskLevel,
            predictedGrade:       analytics?.predictedGrade || null,
            subjects:             analytics?.subjects || [],
          });
        }
      } catch {
        // silently ignore — data panel just stays empty
      }
    };
    fetchStudentData();
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

    // Capture history BEFORE adding new user message (for API call)
    const historySnapshot = [...messages];

    setMessages(p => [...p, userMsg]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
      // ── REAL API CALL — no more mock response ──────────────
      const reply = await callChatbotAPI(content, user, historySnapshot);
      // ───────────────────────────────────────────────────────
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
  }, [input, isTyping, messages, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  };
  const handleChange = (e) => { setInput(e.target.value); autoGrow(e.target); };

  const hasMsg = messages.length > 0;
  const today  = new Date().toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });

  return (
    <>
      <style>{CSS}</style>
      <div className="ss-root">

        {/* ════ CHAT COLUMN ════════════════════════════ */}
        <div className="ss-col">

          {/* Top bar */}
          <div className="ss-bar">
            <div className="ss-bar-left">
              <div className="ss-ai-badge"><Sparkle s={17} /></div>
              <div>
                <div className="ss-bar-name">StudySmart AI</div>
                <div className="ss-bar-status">
                  <div className="ss-pulse-dot" />
                  <span className="ss-status-txt">Online · Powered by Gemini</span>
                </div>
              </div>
            </div>
            <button className="ss-panel-btn" onClick={() => setShowPanel(p => !p)}>
              <PanelIco open={showPanel} />
              {showPanel ? 'Hide panel' : 'Show panel'}
            </button>
          </div>

          {/* Student stats bar */}
          <StudentStatsBar studentData={studentData} />

          {/* Feed */}
          <div className="ss-feed">
            {!hasMsg ? (
              <EmptyState onSend={doSend} />
            ) : (
              <div className="ss-feed-inner">
                <div className="ss-divider">{today}</div>
                {messages.map(m => <Bubble key={m.id} msg={m} />)}
                {isTyping && <TypingIndicator />}
                <div ref={feedEnd} style={{ height:8 }} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="ss-input-wrap">
            {hasMsg && (
              <div className="ss-pills">
                {PILLS.map((p,i) => (
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
            <RightPanel onSend={doSend} studentData={studentData} />
          </div>
        )}

      </div>
    </>
  );
};

export default ChatbotPage;