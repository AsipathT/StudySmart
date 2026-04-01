# Session Timer Cards — Explanation

**File:** `frontend/src/pages/StudySessionPage.jsx`
**Location in UI:** 4-column grid rendered during an active/completed session (lines 1374–1424)

---

## Overview

During an active study session, four stat cards are displayed in a row below the main session timer.
Each card updates in real time every second and feeds directly into the session summary saved to the database.

---

## How the Timers Tick

Both underlying counters are driven by a single `setInterval` running every **1 second**
while `sessionStatus === 'active'`:

```javascript
useEffect(() => {
  if (sessionStatus === 'active') {
    const id = setInterval(() => {
      setUpTime((prev) => prev + 1);           // always increments
      if (pomodoroStatus === 'active') {
        setWorkedTime((prev) => prev + 1);     // only when Pomodoro is running
      }
    }, 1000);
    return () => clearInterval(id);
  }
}, [sessionStatus, pomodoroStatus]);
```

Pausing the session (`sessionStatus === 'paused'`) stops the interval entirely — neither counter advances.

---

## Card 1 — Total Session

| Field | Value |
|-------|-------|
| CSS class | `timer-card-total` |
| Icon | `ClockCircleOutlined` |
| Color | Blue `#60a5fa` |
| Sub-label | "Wall-clock time" |

**What it shows:** The total elapsed real-world time since the session was started, formatted as `HH:MM:SS`.

**State variable:** `upTime` (integer, seconds)

**How it is computed:**
```javascript
// upTime initialises to 0 on session start
setUpTime((prev) => prev + 1);   // increments every second while active
```

- Starts at `0` when `confirmStartSession()` is called.
- Increments every second as long as `sessionStatus === 'active'`.
- **Pausing** the session freezes `upTime` — it does not advance while paused.
- Displayed via `formatTime(upTime)` which converts seconds → `HH:MM:SS`.

**Saved as:** `duration: upTime` in the session POST body.

---

## Card 2 — Focus Time

| Field | Value |
|-------|-------|
| CSS class | `timer-card-focus` |
| Icon | `ThunderboltOutlined` |
| Color | Green `#34d399` |
| Sub-label | "Active pomodoro time" |

**What it shows:** The total seconds the student spent inside an active Pomodoro interval during this session.

**State variable:** `workedTime` (integer, seconds)

**How it is computed:**
```javascript
// workedTime only increments when BOTH conditions are true:
//   1. sessionStatus === 'active'
//   2. pomodoroStatus === 'active'
if (pomodoroStatus === 'active') {
  setWorkedTime((prev) => prev + 1);
}
```

- Starts at `0` when the session begins.
- Advances only while a Pomodoro countdown is actively running.
- If the student never starts a Pomodoro, `workedTime` stays `0`.
- Displayed via `formatTime(workedTime)`.

**Saved as:** `workedTime: workedTime` in the session POST body.

---

## Card 3 — Break / Idle

| Field | Value |
|-------|-------|
| CSS class | `timer-card-break` |
| Icon | `PauseCircleOutlined` |
| Color | Amber `#fbbf24` |
| Sub-label | "Non-focus time" |

**What it shows:** The amount of session time spent **not** in an active Pomodoro — i.e., browsing, setting up, resting between intervals, or having the session open without a Pomodoro running.

**How it is computed:**
```javascript
const breakTime = upTime - workedTime;
```

This is a **derived value**, calculated at render time inside the summary render block (line 1311). It is never stored as its own state variable — it is always recomputed from the other two.

- `breakTime = 0` only if the student ran a Pomodoro for the entire session without pause.
- If no Pomodoro was ever started, `breakTime === upTime` (all time is idle).
- Displayed via `formatTime(breakTime)`.

**Not saved separately** — the backend can derive it as `duration - workedTime`.

---

## Card 4 — Focus Rate

| Field | Value |
|-------|-------|
| CSS class | `timer-card-rate` |
| Icon | `TrophyOutlined` |
| Color | Indigo `#818cf8` |
| Sub-label | Dynamic performance label (see below) |

**What it shows:** The percentage of total session time that was spent in active Pomodoro focus.

**How it is computed:**
```javascript
const focusRate = upTime > 0
  ? Math.round((workedTime / upTime) * 100)
  : 0;
```

- Expressed as an integer percentage (0–100).
- Guarded against division by zero: returns `0` if `upTime === 0`.
- Displayed directly as `{focusRate}%`.

**Sub-label changes dynamically based on the rate:**

| Focus Rate | Sub-label |
|-----------|-----------|
| ≥ 70% | "Excellent" |
| ≥ 40% | "Good" |
| > 0% | "Can improve" |
| 0% | "No pomodoro used" |

```javascript
focusRate >= 70 ? 'Excellent'
  : focusRate >= 40 ? 'Good'
  : focusRate > 0  ? 'Can improve'
  : 'No pomodoro used'
```

**Not saved separately** — the backend computes it from `workedTime / duration`.

---

## Summary Table

| Card | State Variable | Formula | Saved to DB |
|------|---------------|---------|-------------|
| Total Session | `upTime` | Increments +1/sec while `sessionStatus === 'active'` | Yes — as `duration` |
| Focus Time | `workedTime` | Increments +1/sec while `sessionStatus === 'active'` AND `pomodoroStatus === 'active'` | Yes — as `workedTime` |
| Break / Idle | _(derived)_ | `upTime - workedTime` | No (derivable server-side) |
| Focus Rate | _(derived)_ | `Math.round((workedTime / upTime) * 100)` | No (derivable server-side) |

---

## Session State Flow

```
confirmStartSession()
  │  upTime = 0, workedTime = 0
  ▼
sessionStatus = 'active'
  │  upTime +1/sec always
  │
  ├─ Pomodoro NOT started
  │    workedTime stays 0
  │    breakTime = upTime (all time is idle)
  │    focusRate = 0%
  │
  └─ Pomodoro started → pomodoroStatus = 'active'
       workedTime +1/sec
       breakTime = upTime - workedTime
       focusRate = round(workedTime / upTime × 100)%

pauseSession()
  │  sessionStatus = 'paused'
  │  interval cleared → both timers freeze

resumeSession()
  │  sessionStatus = 'active'
  │  interval restarts

stopSession() → summary rendered with final values
```
