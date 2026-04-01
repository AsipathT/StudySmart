# Tracking Summary — Page Documentation

**File:** `frontend/src/pages/TrackingSummaryPage.jsx`
**CSS:** `frontend/src/pages/TrackingSummaryPage.css`
**Route:** `/tracking-summary`
**Access:** Students only (admin is redirected via `StudentRoute`)

---

## Overview

The Tracking Summary page provides a read-only history view of all completed study sessions. Students can browse their sessions, filter by subject, date range, and (admins only) by student. Clicking a session tile opens a detailed modal showing full stats for that session.

---

## Features

### Aggregate Stats Row
Displays 5 summary cards computed from the filtered session list:

| Card | Metric |
|------|--------|
| Sessions | Total number of sessions |
| Total Time | Sum of all session durations |
| Focus Time | Sum of all Pomodoro-focused time |
| Pomodoros | Total Pomodoro intervals completed |
| Avg Focus Rate | Average focus rate across all sessions |

### Filters
- **Subject** — filter sessions by subject name
- **User** — filter by student (admin view only)
- **Date Range** — filter sessions by start date using Ant Design `DatePicker.RangePicker`
- **Clear Filters** button resets all filters

### Session Tiles
Each session is rendered as a compact card (`SessionTile`) showing:
- Subject icon and name
- Unit/module name
- Session date and start time
- Duration badge
- Focus rate percentage (color-coded)
- Number of Pomodoros completed
- Chevron to open detail modal

### Session Detail Modal (`SessionDetailModal`)
Opens when a tile is clicked. Contains:
- Gradient hero banner with subject name and "Session Complete" badge
- 4 stat cards: Total Session time, Focus Time, Break/Idle, Focus Rate
- Pomodoro summary section
- Full session details: subject, unit, material, start/end time, date

---

## Libraries Used

| Library | Purpose |
|---------|---------|
| `react` | UI framework, hooks |
| `antd` | `Select`, `DatePicker`, `Spin`, `Modal` |
| `@ant-design/icons` | Icons throughout the page |
| `axios` | HTTP requests (user list fetch) |

---

## Custom Hooks & Services

| Import | Source | Purpose |
|--------|--------|---------|
| `useAuth` | `hooks/useAuth` | Get current user, role |
| `studySessionService` | `services/studySessionService` | Fetch session history |
| `subjectService` | `services/subjectService` | Fetch subjects for filter dropdown |

---

## State Variables

| State | Type | Description |
|-------|------|-------------|
| `history` | array | Loaded study sessions |
| `subjects` | array | All subjects for the filter dropdown |
| `loading` | boolean | Spinner while fetching |
| `usersList` | array | All users (admin only, for filter) |
| `filters` | object | `{ subject, userId, dateRange }` |
| `selected` | object / null | Session opened in detail modal |

---

## Key Functions

| Function | Description |
|----------|-------------|
| `fetchInitialData()` | Loads subjects and users list on mount |
| `fetchHistory()` | Loads sessions applying current filters |
| `formatTime(s)` | Converts seconds → `HH:MM:SS` |
| `formatDur(s)` | Converts seconds → human string e.g. `1h 30m` |
| `fmtTime(date)` | Formats to locale time string |
| `fmtDate(date)` | Formats to short locale date string |
| `fmtDateFull(date)` | Formats to full locale date string |
| `SessionTile({ session })` | Renders a single session summary card |
| `SessionDetailModal({ session, onClose })` | Renders the detail modal for a session |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/users` | Fetch all users (admin only) |
| GET | `/api/subjects` | Fetch all subjects |
| GET | `/api/study-sessions` | Fetch all sessions with filters (admin) |
| GET | `/api/study-sessions/user/:id` | Fetch sessions for a specific user |

### Filter Query Parameters

Sessions are fetched with optional query parameters:

| Parameter | Description |
|-----------|-------------|
| `subject` | Filter by subject name |
| `userId` | Filter by user ID (admin) |
| `startDate` | Filter sessions after this date |
| `endDate` | Filter sessions before this date |

---

## Focus Rate Color Coding

| Rate | Color |
|------|-------|
| ≥ 70% | Green |
| ≥ 40% | Yellow/Amber |
| > 0% | Red |
| 0% | Gray |

---

## Subject Icon Map

The page uses a shared icon map to render subject icons by key:

| Key | Icon |
|-----|------|
| `calculator` | `CalculatorOutlined` |
| `experiment` | `ExperimentOutlined` |
| `book` | `BookOutlined` |
| `global` | `GlobalOutlined` |
| `laptop` | `LaptopOutlined` |
| _(default)_ | `BookOutlined` |
