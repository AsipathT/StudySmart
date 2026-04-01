# Material Mastery — Page Documentation

**File:** `frontend/src/pages/MaterialMasteryPage.jsx`
**CSS:** `frontend/src/pages/MaterialMasteryPage.css`
**Route:** `/material-mastery`
**Access:** Students only (admin is redirected via `StudentRoute`)

---

## Overview

The Material Mastery page gives students a unified view of how well they have learned each study material across all subjects. It combines data from study sessions and quiz attempts to compute a **mastery score (0–100)** for every material. The page includes a 28-day activity heatmap, a needs-attention callout, collapsible subject sections, and a score formula breakdown.

---

## Mastery Score Algorithm

Each material receives a score out of 100 computed from three data sources:

| Component | Max Points | Data Source | Calculation |
|-----------|-----------|-------------|-------------|
| Time Score | 35 pts | Study sessions | `min(focusMinutes / 60, 1) × 35` |
| Pages Score | 40 pts | Session page tracking | `bestPagesCompletion% × 40` |
| Quiz Score | 25 pts | Quiz attempts | `bestQuizScore% × 25` |
| **Total** | **100 pts** | — | Sum of above |

### Mastery Tiers

| Score Range | Label | Color |
|-------------|-------|-------|
| 0 | Not Started | Gray `#64748b` |
| 1 – 39 | Exploring | Red `#f87171` |
| 40 – 69 | Learning | Yellow `#fbbf24` |
| 70 – 89 | Proficient | Blue `#60a5fa` |
| 90 – 100 | Mastered | Green `#4ade80` |

---

## Features

### Stats Row
Five summary tiles at the top of the page:

| Tile | Metric | Color |
|------|--------|-------|
| Total Materials | Count of all materials across subjects | Indigo |
| Mastered | Materials with score ≥ 90 | Green |
| In Progress | Materials with score 1–89 | Amber |
| Not Started | Materials with score 0 | Red |
| Avg Mastery | Average score across all materials | Blue |

### Needs Attention
- Highlights up to 5 materials with mastery score < 40
- Shown as colored pill badges with the material name and current score

### Study Activity Heatmap
- Shows the last **28 days** of study activity
- Each cell represents one day
- Cell color intensity reflects total minutes studied that day:

| Minutes | Color |
|---------|-------|
| 0 | Dark dim `rgba(255,255,255,0.03)` |
| 1–14 | Light green `#166534` |
| 15–29 | Medium green `#15803d` |
| 30–59 | Bright green `#16a34a` |
| 60+ | Vivid green `#4ade80` |

- Hovering a cell shows a tooltip with date, total minutes, and session count

### Subject Sections (Collapsible)
Each subject is shown as a collapsible section with:
- Gradient header button with subject icon, name, material count, mastered count
- Mastery progress ring for the subject's average score
- Expandable list of all materials showing:
  - PDF icon and material name
  - Unit/module the material belongs to
  - Mastery progress bar (colored by tier)
  - Study duration badge
  - Pages completion % badge
  - Best quiz score % badge
  - Mastery score % label

### Score Formula Card
A fixed card at the bottom of the page explaining how the mastery score is calculated with the three components (Time, Pages, Quiz) and the tier legend.

---

## Libraries Used

| Library | Purpose |
|---------|---------|
| `react` | UI framework, hooks |
| `antd` | `Spin`, `message` |
| `@ant-design/icons` | Icons throughout the page |

---

## Custom Hooks & Services

| Import | Source | Purpose |
|--------|--------|---------|
| `useAuth` | `hooks/useAuth` | Get current user ID |
| `subjectService` | `services/subjectService` | Fetch all subjects with units and materials |
| `studySessionService` | `services/studySessionService` | Fetch user's study sessions |
| `quizService` | `services/quizService` | Fetch user's quiz attempt history |

---

## State Variables

| State | Type | Description |
|-------|------|-------------|
| `subjects` | array | All subjects with nested units and materials |
| `sessions` | array | All study sessions for the current user |
| `quizHistory` | array | All quiz attempts for the current user |
| `loading` | boolean | Spinner shown during initial data fetch |
| `expanded` | object | Tracks which subjects are expanded `{ [subjectId]: boolean }` |

---

## Key Functions

| Function | Description |
|----------|-------------|
| `loadAll()` | Fetches subjects, sessions, and quiz history in parallel via `Promise.all()` |
| `computeMastery(material, sessions, quizAttempts)` | Calculates mastery score 0–100 for a material |
| `getMasteryConfig(score)` | Returns `{ label, color, trackColor, barColor, bg, border }` for a score |
| `heatColor(minutes)` | Returns background color for a heatmap cell based on minutes studied |
| `MiniRing({ score, size, color })` | SVG circular progress ring component |
| `getSubjectIcon(key)` | Returns an Ant Design icon component by key string |
| `formatDur(seconds)` | Converts seconds to human-readable duration string |
| `toggleExpand(subjectId)` | Toggles expansion state for a subject section |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/subjects` | Fetch all subjects with units and materials |
| GET | `/api/study-sessions/user/:id` | Fetch all study sessions for user |
| GET | `/api/quizzes/history` | Fetch all quiz attempts for user |

---

## Data Enrichment Flow

```
loadAll() runs Promise.all([subjects, sessions, quizHistory])
        │
        ▼
allMaterials = flatten all materials from all subjects/units
        │
        ▼
For each material:
  ├─ Filter sessions where materialName matches
  ├─ Filter quiz attempts where material matches
  ├─ Run computeMastery(material, sessions, quizAttempts)
  └─ Attach: score, tier, sessionCount, focusTime, bestPages%, bestQuiz%
        │
        ▼
Compute heatmap: group sessions by day → last 28 days
        │
        ▼
Compute stats: total, mastered, inProgress, notStarted, avgMastery
        │
        ▼
Compute needsAttention: materials with score < 40, sorted ascending, top 5
        │
        ▼
Render UI
```

---

## MiniRing SVG Component

The `MiniRing` component renders a circular progress indicator using SVG:

```
Props:
  score  — number 0–100
  size   — diameter in pixels (default 48)
  color  — stroke color string

SVG Structure:
  <svg>
    <circle />   ← background track (low opacity)
    <circle />   ← foreground arc (score-based dashoffset)
    <text />     ← score label in center
  </svg>

Calculation:
  radius = (size / 2) - strokeWidth
  circumference = 2 × π × radius
  strokeDashoffset = circumference × (1 - score / 100)
```

---

## Heatmap Construction

```javascript
// Last 28 days generated as array of { date, totalMin, count }
for (let i = 27; i >= 0; i--) {
  const day = subDays(today, i);
  const daySessions = sessions.filter(s =>
    isSameDay(new Date(s.startTime), day)
  );
  heatmap.push({
    date: day,
    totalMin: sum of session durations in minutes,
    count: daySessions.length
  });
}
```
