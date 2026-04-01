# Material Mastery — Tile & Card Data Explanation

**File:** `frontend/src/pages/MaterialMasteryPage.jsx`

This document explains every tile and card on the Material Mastery page:
what it displays, where each value comes from, and exactly how it is computed.

---

## Data Sources (3 API calls on page load)

All tiles on the page derive their data from three parallel API calls made inside `loadAll()`:

```javascript
const [subjR, sessR, quizR] = await Promise.all([
  subjectService.getAllSubjects(),                   // → subjects[]
  studySessionService.getHistory(user.id),           // → sessions[]
  quizService.getHistory(),                          // → quizHistory[]
]);
```

| Variable | API Endpoint | Contains |
|----------|-------------|---------|
| `subjects` | `GET /api/subjects` | All subjects with nested units and materials |
| `sessions` | `GET /api/study-sessions/user/:id` | All completed study sessions for the user |
| `quizHistory` | `GET /api/quizzes/history` | All quiz attempts by the user |

After fetching, the page builds an `enriched` array — one entry per material — by combining all three data sources for each material.

---

## Enriched Material Object

Before any tile is rendered, every material is enriched with computed values:

```javascript
const enriched = allMaterials.map(mat => {
  const matSessions = sessions.filter(s =>
    s.materialName.toLowerCase() === mat.name.toLowerCase()
  );

  const mastery       = computeMastery(mat, matSessions, quizHistory);
  const totalStudySec = sum of session.duration
  const totalFocusSec = sum of session.workedTime
  const bestPages     = best (pagesCompleted / totalPages) × 100 across sessions
  const bestQuiz      = best (score / totalQuestions) × 100 across quiz attempts
  const lastSession   = most recent session by endTime
  const sessionCount  = matSessions.length

  return { ...mat, mastery, cfg, sessionCount, totalStudySec,
           totalFocusSec, bestPages, bestQuiz, lastSession };
});
```

This `enriched` array powers every tile on the page.

---

## 1. Stats Row Tiles

Five summary tiles at the top of the page. Each is a `.mastery-stat-card`.

---

### Tile 1 — Total Materials

| Field | Value |
|-------|-------|
| Icon | `BookOutlined` |
| Color | Indigo `#818cf8` |

**What it shows:** The total count of all materials across every subject and unit the student has access to.

**How the data is derived:**
```javascript
const total = enriched.length;
```
`enriched` is built by flattening all materials from two places:
- `subj.materials[]` — materials directly on a subject
- `subj.units[].materials[]` — materials inside each unit

Every material found (regardless of whether it has been studied) counts toward this number.

---

### Tile 2 — Mastered

| Field | Value |
|-------|-------|
| Icon | `TrophyOutlined` |
| Color | Green `#4ade80` |

**What it shows:** Number of materials where the computed mastery score is **≥ 90**.

**How the data is derived:**
```javascript
const mastered = enriched.filter(m => m.mastery >= 90).length;
```

A material reaches ≥ 90 only when the student has accumulated enough focused study time, completed a high percentage of pages, and scored well on the quiz. See the mastery score formula in Section 7.

---

### Tile 3 — In Progress

| Field | Value |
|-------|-------|
| Icon | `FireOutlined` |
| Color | Amber `#fbbf24` |

**What it shows:** Number of materials where the student has started studying but has not yet mastered them (mastery score **1 – 89**).

**How the data is derived:**
```javascript
const inProgress = enriched.filter(m => m.mastery > 0 && m.mastery < 90).length;
```

Any material with at least one study session recorded will have a mastery score > 0, placing it here until it reaches 90.

---

### Tile 4 — Not Started

| Field | Value |
|-------|-------|
| Icon | `MinusCircleOutlined` |
| Color | Red `#f87171` |

**What it shows:** Number of materials with **zero** study sessions recorded (mastery score = 0).

**How the data is derived:**
```javascript
const notStarted = enriched.filter(m => m.mastery === 0).length;
```

`computeMastery()` returns 0 immediately if `matSessions.length === 0`, so any material with no matching sessions is counted here.

---

### Tile 5 — Avg Mastery

| Field | Value |
|-------|-------|
| Icon | `ThunderboltOutlined` |
| Color | Blue `#60a5fa` |

**What it shows:** The average mastery score (%) across **all** materials, including unstarted ones.

**How the data is derived:**
```javascript
const avgMastery = total > 0
  ? Math.round(enriched.reduce((s, m) => s + m.mastery, 0) / total)
  : 0;
```

Sum of all mastery scores divided by total number of materials, rounded to the nearest integer. Materials with score 0 bring the average down, making this a true overall learning health metric.

---

## 2. Needs Attention Card

**What it shows:** Up to **5 materials** that have been attempted but have a very low mastery score (< 40). These are the materials that need the most focus.

**How the data is derived:**
```javascript
const needsAttention = enriched
  .filter(m => m.mastery < 40)
  .slice(0, 5);
```

Each pill inside this card shows:
- Material name — from `mat.name` (MongoDB field)
- Score badge — `mat.mastery` (computed, 0–39)
- Color — from `getMasteryConfig(mastery)` which returns red (`#f87171`) for Exploring tier

> This card only renders if `needsAttention.length > 0`.

---

## 3. Study Activity Heatmap Card

**What it shows:** A 28-cell grid where each cell = one day. Cell color intensity shows how many minutes were studied that day.

**How the data is derived:**

```javascript
for (let i = 27; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);

  const daySessions = sessions.filter(s =>
    new Date(s.startTime).toDateString() === d.toDateString()
  );

  const totalMin = daySessions.reduce(
    (s, ss) => s + Math.round((ss.duration || 0) / 60), 0
  );

  days.push({ date: d, totalMin, count: daySessions.length });
}
```

- `sessions` comes from the API (`GET /api/study-sessions/user/:id`)
- Each session has a `startTime` (ISO date) and `duration` (seconds)
- Sessions are matched to a day by comparing `toDateString()`
- `totalMin` = sum of all session durations in minutes for that day

**Cell color** is determined by `heatColor(totalMin)`:

| Minutes Studied | Cell Color |
|----------------|-----------|
| 0 (no sessions) | Very dim `rgba(255,255,255,0.04)` |
| 1 – 14 min | Light indigo `rgba(99,102,241,0.25)` |
| 15 – 29 min | Medium indigo `rgba(99,102,241,0.45)` |
| 30 – 59 min | Strong indigo `rgba(99,102,241,0.65)` |
| 60+ min | Vivid indigo `rgba(99,102,241,0.9)` |

**Tooltip on hover** shows:
```
"Mon, Mar 25: 45m studied (2 sessions)"
```
Data: `day.date` (formatted) + `day.totalMin` + `day.count`

---

## 4. Subject Section Header (Collapsible Tile)

Each subject that has at least one material gets a collapsible header tile.

**What it shows:**

| Element | Data | Source |
|---------|------|--------|
| Subject icon | `subj.icon` key → mapped to AntD icon | Subject document in MongoDB |
| Subject name | `subj.name` | Subject document |
| Material count | `subj.enrichedMaterials.length` | Count of enriched materials for this subject |
| Mastered count | `enrichedMaterials.filter(m => m.mastery >= 90).length` | Computed from enriched array |
| Progress ring | `subj.avgMastery` % | Average of all material mastery scores for this subject |
| Ring color | `getMasteryConfig(subj.avgMastery).color` | Tier color based on average score |
| Chevron | Up/down arrow | `expanded[subj._id]` boolean state |

**Subject average mastery:**
```javascript
const subjAvg = mats.length
  ? Math.round(mats.reduce((s, m) => s + m.mastery, 0) / mats.length)
  : 0;
```

**MiniRing SVG calculation:**
```javascript
const r    = (size - 6) / 2;           // ring radius
const circ = 2 × π × r;               // full circumference
strokeDashoffset = circ × (1 - pct / 100);  // arc length for the score
```
The ring starts at the top (rotated -90°) and fills clockwise proportionally to the score.

---

## 5. Material Row Tile

Each material inside an expanded subject section is a `.mastery-mat-row`. It has four distinct areas:

---

### Area A — PDF Icon
- Always shows a red `FilePdfOutlined` icon
- Indicates the material is a PDF document

---

### Area B — Name, Unit Label, and Progress Bar

| Element | Data | Source |
|---------|------|--------|
| Material name | `mat.name` | Material document in MongoDB |
| Unit label | `mat.unitName` | Set during `allMaterials` flattening — `unit.name` if material is inside a unit, `null` if directly on subject |
| Progress bar width | `mat.mastery` % | `computeMastery()` result |
| Progress bar color | `cfg.barColor` | From `getMasteryConfig(mastery)` |
| Track (background) color | `cfg.trackColor` | From `getMasteryConfig(mastery)` |

---

### Area C — Badges (only shown if data exists)

**Badge 1 — Study Time (blue)**
```javascript
{mat.sessionCount > 0 && (
  <span>{formatDur(mat.totalStudySec)}</span>
)}
```
- `totalStudySec` = sum of `session.duration` for all sessions where `session.materialName === mat.name`
- `session.duration` is saved in seconds when a session is stopped
- `formatDur()` converts to `"1h 30m"` or `"45m"`

**Badge 2 — Pages Completion (indigo)**
```javascript
{mat.bestPages !== null && (
  <span>📄 {mat.bestPages}%</span>
)}
```
- `bestPages` = best `(pagesCompleted / totalPages) × 100` across all sessions for this material
- Only shown if at least one session tracked page progress (`totalPages > 0`)
- `pagesCompleted` and `totalPages` are saved per session when stopped

**Badge 3 — Best Quiz Score (amber)**
```javascript
{mat.bestQuiz !== null && (
  <span>Quiz {mat.bestQuiz}%</span>
)}
```
- `bestQuiz` = best `(attempt.score / attempt.totalQuestions) × 100` across all quiz attempts
- Matched by comparing `quizAttempt.materialName.toLowerCase() === mat.name.toLowerCase()`
- Only shown if the student has attempted at least one quiz for this material

---

### Area D — Score and Status Badge

| Element | Data | Source |
|---------|------|--------|
| Score number | `mat.mastery` | `computeMastery()` result (0–100) |
| Score color | `cfg.color` | `getMasteryConfig(mastery).color` |
| Status label | `cfg.label` | `getMasteryConfig(mastery).label` |
| Status badge bg/border | `cfg.bg`, `cfg.border` | `getMasteryConfig(mastery)` |

**Status labels by score:**

| Score | Label | Color |
|-------|-------|-------|
| 0 | Not Started | Gray `#64748b` |
| 1–39 | Exploring | Red `#f87171` |
| 40–69 | Learning | Amber `#fbbf24` |
| 70–89 | Proficient | Blue `#60a5fa` |
| 90–100 | Mastered ✓ | Green `#4ade80` |

---

## 6. Mastery Score Formula Card

**What it shows:** A static explanation card at the bottom of the page showing how the mastery score is computed. Not interactive.

Contains:
- Three breakdown rows (Focus Time 35 pts, Pages Read 40 pts, Quiz Score 25 pts)
- Five status tier legend pills (Not Started → Mastered)

All values are hardcoded display data, not computed at runtime.

---

## 7. Mastery Score Formula (Full Detail)

The `computeMastery(material, matSessions, quizAttempts)` function:

```javascript
// Returns 0 if no sessions exist for this material
if (matSessions.length === 0) return 0;

// ── Component 1: Time Score (max 35 pts) ──
const totalFocusSec = sum of session.workedTime across matSessions
//   workedTime = seconds spent in active Pomodoro intervals
const timeScore = min(totalFocusSec / (15 × 60), 1) × 35
//   15 minutes of Pomodoro focus = full 35 pts

// ── Component 2: Pages Score (max 40 pts) ──
const bestPagePct = max((pagesCompleted / totalPages)) across sessions
//   only sessions where totalPages > 0 are considered
const pagesScore = bestPagePct × 40

// ── Component 3: Quiz Score (max 25 pts) ──
const bestQuizPct = max(score / totalQuestions) across matching quiz attempts
//   matched by material name (case-insensitive)
const quizScore = bestQuizPct × 25

// ── Final score ──
return min(round(timeScore + pagesScore + quizScore), 100)
```

**Score range examples:**

| Scenario | Time | Pages | Quiz | Total |
|----------|------|-------|------|-------|
| Not studied | 0 | 0 | 0 | 0 |
| 15m Pomodoro only | 35 | 0 | 0 | 35 |
| 15m + 100% pages | 35 | 40 | 0 | 75 |
| 15m + 100% pages + 80% quiz | 35 | 40 | 20 | 95 |
| Full mastery | 35 | 40 | 25 | 100 |
