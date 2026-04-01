# Study Session Tracker — Page Documentation

**File:** `frontend/src/pages/StudySessionPage.jsx`
**CSS:** `frontend/src/pages/StudySessionPage.css`
**Route:** `/study-tracker`
**Access:** All authenticated users (admin + students)

---

## Overview

The Study Session Tracker is the core page of the application. It allows students to track their study sessions against specific subjects, units, and materials. The page includes a full-session timer, a Pomodoro focus timer, session controls, PDF report generation, and an admin panel for managing subjects and students.

---

## Navigation Stages

The page uses a `stage` state to navigate between views without a route change:

| Stage | Description |
|-------|-------------|
| `subjects` | Grid of all available subjects |
| `units` | Units within the selected subject |
| `unit-details` | Materials list inside a unit |
| `session` | Active study session with timers |
| `summary` | Post-session summary with stats |

---

## Features

### Subject & Unit Selection
- Displays all subjects as gradient tile cards with icons
- Each subject shows unit count and (for admin) student count
- Clicking a subject navigates to its units list
- Clicking a unit opens its material list

### Study Session
- Start a session for a specific material or the full module
- A confirmation modal appears before starting (explains timers)
- **Session Timer (upTime)** — wall-clock time counting up from session start
- **Pause / Resume** — pause the session timer at any time
- **Stop** — ends the session and navigates to summary

### Pomodoro Timer
- Separate countdown timer for focused work intervals
- Duration options: 2m, 5m, 10m, 25m, 50m
- Counts completed intervals (`intervalsCompleted`)
- `workedTime` accumulates only while a Pomodoro is running
- Auto-stops when countdown reaches zero; plays a sound cue

### Session Summary
- Total session time, focus time, break/idle time, focus rate %
- Pomodoro summary (intervals completed, avg per interval)
- Reading progress (if pages were tracked)
- Save to database or discard
- Export as PDF report

### PDF Export
- Uses **jsPDF** + **jspdf-autotable** to generate a downloadable report
- Includes subject, unit, material, duration, intervals, start/end times

### Admin Panel
- Admins can create, edit, and delete subjects
- Assign/remove students from subjects
- Upload PDF materials to units
- Edit subject gradient color and icon
- Manage units within subjects

---

## Libraries Used

| Library | Purpose |
|---------|---------|
| `react` | UI framework, hooks |
| `antd` | UI components (Modal, Card, Table, Form, Tabs, etc.) |
| `@ant-design/icons` | Icons throughout the page |
| `axios` | HTTP requests to backend API |
| `jspdf` | PDF generation for session reports |
| `jspdf-autotable` | Table rendering inside PDFs |

---

## Custom Hooks & Services

| Import | Source | Purpose |
|--------|--------|---------|
| `useAuth` | `hooks/useAuth` | Get current user and role |
| `subjectService` | `services/subjectService` | CRUD operations for subjects |
| `studySessionService` | `services/studySessionService` | Save and fetch session history |

---

## State Variables

| State | Type | Description |
|-------|------|-------------|
| `stage` | string | Current view stage |
| `subjects` | array | All loaded subjects |
| `selectedSubject` | object | Currently selected subject |
| `selectedUnit` | object | Currently selected unit |
| `unitHistory` | array | Past sessions for the unit |
| `sessionStatus` | string | `'inactive'` / `'active'` / `'paused'` |
| `upTime` | number | Total session seconds elapsed |
| `workedTime` | number | Seconds accumulated during Pomodoro |
| `pomodoroTime` | number | Remaining seconds in current Pomodoro |
| `pomodoroStatus` | string | `'inactive'` / `'active'` |
| `intervalsCompleted` | number | Completed Pomodoro intervals |
| `initialPomodoroTime` | number | Pomodoro duration in seconds |
| `pagesCompleted` | number | Pages read in session |
| `materialBeingStudied` | string | Name of material being studied |
| `showStartModal` | boolean | Controls start-session confirmation modal |
| `stopModalVisible` | boolean | Controls stop-session confirmation modal |
| `adminModalVisible` | boolean | Controls admin subject-management modal |

---

## Key Functions

| Function | Description |
|----------|-------------|
| `fetchSubjects()` | Loads all subjects from the backend |
| `fetchUsers()` | Loads user list for admin assignment |
| `fetchUnitHistory()` | Loads session history for a unit |
| `startSessionWithMaterial(name)` | Opens start confirmation modal |
| `confirmStartSession()` | Sets session state to active and starts timers |
| `startSession()` | Resumes a paused session |
| `pauseSession()` | Pauses the session timer |
| `stopSession()` | Ends session and goes to summary |
| `handleStopConfirm()` | Finalises session data for summary |
| `startPomodoro()` | Starts the Pomodoro countdown interval |
| `setIntervalTime(minutes)` | Sets the Pomodoro duration |
| `handleSaveSummary()` | POSTs the completed session to the backend |
| `generatePDF()` | Builds and downloads the PDF report |
| `formatTime(seconds)` | Converts seconds → `HH:MM:SS` string |
| `getSubjectGradient(color)` | Maps a hex/gradient color to a CSS gradient |
| `reset()` | Resets all state back to initial |
| `handleCreateSubject()` | Submits new subject to backend |

---

## Refs

| Ref | Purpose |
|-----|---------|
| `pomodoroIntervalRef` | Holds the `setInterval` ID for the Pomodoro countdown |
| `pomodoroFiredRef` | Prevents duplicate interval-complete events |
| `stopSessionMatRef` | Stores material name when stop confirmation is shown |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/users` | Fetch all users (admin) |
| GET | `/api/subjects` | Get all subjects |
| GET | `/api/subjects/:id` | Get subject with full units/materials |
| POST | `/api/subjects` | Create new subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |
| GET | `/api/study-sessions` | Get all sessions (admin) |
| GET | `/api/study-sessions/user/:id` | Get user's sessions |
| POST | `/api/study-sessions` | Save completed session |

---

## Timer Logic

```
Session start
│
├─ upTime increments every second (total wall-clock time)
│
└─ Pomodoro start
   ├─ pomodoroTime counts DOWN every second
   ├─ workedTime increments every second (focus time)
   └─ When pomodoroTime === 0 → intervalsCompleted++, auto-stop

Focus Rate = (workedTime / upTime) × 100
```

---

## PDF Report Contents

- Subject name, unit name, material name
- Session duration (formatted)
- Number of Pomodoro intervals completed
- Start and end timestamps
- Specific material studied
