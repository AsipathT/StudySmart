# 🎨 Visual Architecture & Component Guide

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDYSMART SYSTEM                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│    FRONTEND (React)      │         │   BACKEND (Node.js)      │
├──────────────────────────┤         ├──────────────────────────┤
│                          │         │                          │
│  1. Upload Interface     │────────▶│  Upload Controller       │
│     ↓                    │         │  ├─ Process Files        │
│  2. Analytics Dashboard  │◀────────│  ├─ Extract Marks        │
│     ↓                    │         │  └─ Save to DB           │
│  3. Prediction Page      │────────▶│                          │
│                          │         │  Analytics Service       │
└──────────────────────────┘         │  ├─ Calculate GPA        │
                                     │  ├─ Aggregate Marks      │
                                     │  └─ Generate Reports     │
                                     │                          │
                                     └──────────────────────────┘
                                               │
                                               ▼
                                     ┌──────────────────────┐
                                     │  PostgreSQL Database │
                                     ├──────────────────────┤
                                     │ - QuizScore          │
                                     │ - Student            │
                                     │ - ExtractedData      │
                                     └──────────────────────┘
```

## 🔄 Data Flow

```
UPLOAD PROCESS
==============

Student Uploads PDF
        │
        ▼
MultipleFileUpload
Component detects
        │
        ▼
POST /api/upload/upload
        │
        ▼
Backend UploadController
├─ Parse File (PDF/CSV/Excel)
├─ Normalize Student IDs
├─ Extract: StudentID, Subject, Score, Type
├─ Create/Update Student record
├─ Create QuizScore with userId
        │
        ▼
Database QuizScore Table
┌────┬────────┬───────┬─────────┬────────┐
│ ID │ userId │Subject│ Score   │ Type   │
├────┼────────┼───────┼─────────┼────────┤
│ 1  │ user1  │ IT1140│ 85.0    │ Quiz   │
│ 2  │ user1  │ IT1140│ 92.0    │ Exam   │
└────┴────────┴───────┴─────────┴────────┘
        │
        ▼
Frontend Auto-Refresh
Analytics Dashboard


ANALYTICS PROCESS
=================

User Opens Analytics
        │
        ▼
GET /api/analytics/user
        │
        ▼
Backend Query & Calculate
├─ SELECT * FROM quiz_scores WHERE userId = ?
├─ GROUP BY subject
├─ Calculate Averages
├─ Calculate GPA = ((avg-40)/60)*4.0
├─ Assign Grades (A+, A, B+, etc.)
        │
        ▼
Return Analytics Object
{
  userId: "user1",
  gpa: 3.05,
  averageMarks: 85.75,
  subjects: [
    {
      subject: "IT1140",
      average: 88.5,
      grade: "A",
      count: 2,
      min: 85,
      max: 92
    }
  ]
}
        │
        ▼
UserAnalyticsDashboard
├─ Display KPI Cards
├─ Display Subject Table
├─ Display Charts
└─ Enable Export


PREDICTION PROCESS
==================

User Selects Subject
        │
        ▼
GET /api/predictions/user/subjects
        │
        ▼
Backend Returns Subject List
with marks statistics
        │
        ▼
User Clicks "Predict"
        │
        ▼
POST /api/predictions/generate
        │
        ▼
PredictionService
├─ Calculate Average of scores
├─ Apply Study Hours Impact
├─ Calculate Trend
├─ Predict Future Score
├─ Calculate Confidence
        │
        ▼
Display Prediction
├─ Predicted Score
├─ Confidence Level
├─ Recommended Study Hours
└─ Based on Your Marks
```

## 🗂️ Component Structure

```
FRONTEND COMPONENTS
===================

src/
├── components/
│   ├── upload/
│   │   ├── FileUpload.jsx (Original - Single File)
│   │   ├── UploadStatus.jsx
│   │   └── MultipleFileUpload.jsx ✨ NEW
│   │       ├── Drag-Drop Upload
│   │       ├── Upload History Table
│   │       ├── Progress Tracking
│   │       └── Real-time Analytics
│   │
│   └── analytics/
│       ├── PerformanceChart.jsx
│       ├── StatsCard.jsx
│       ├── SubjectCard.jsx
│       └── UserAnalyticsDashboard.jsx ✨ NEW
│           ├── KPI Cards
│           ├── Subject Performance Table
│           ├── Bar Chart
│           ├── Recent Marks List
│           └── Export Button
│
├── services/
│   ├── upload.service.js (Enhanced)
│   │   └── + getUserMarks()
│   └── analytics.service.js (Enhanced)
│       └── + getUserAnalytics()
│
└── pages/
    ├── UploadPage.jsx
    │   └── Uses: MultipleFileUpload
    └── AnalyticsPage.jsx
        └── Uses: UserAnalyticsDashboard


BACKEND STRUCTURE
=================

src/
├── controllers/
│   ├── upload.controller.js (Enhanced)
│   │   ├── uploadFile() - Added userId
│   │   ├── processCSV() - Added userId
│   │   ├── processPDF() - Added userId
│   │   ├── processExcel() - Added userId
│   │   ├── saveRows() - Added userId linkage
│   │   └── getUserMarks() ✨ NEW
│   │
│   ├── analytics.controller.js (Enhanced)
│   │   ├── getStudentDashboard()
│   │   ├── getSubjectAnalytics()
│   │   ├── getClassSummary()
│   │   ├── getAnalyticsOverview()
│   │   └── getUserAnalytics() ✨ NEW
│   │
│   └── prediction.controller.js (Enhanced)
│       ├── getStudentSubjects()
│       ├── generatePrediction()
│       ├── getPredictionHistory()
│       ├── getPredictionBySubject()
│       └── getUserSubjects() ✨ NEW
│
├── services/
│   ├── analytics.service.js
│   │   ├── calcGPA()
│   │   ├── getGrade()
│   │   ├── getSubjectPerformance()
│   │   ├── buildProfileAnalytics()
│   │   └── [More utility functions]
│   │
│   └── prediction.service.js
│       ├── generatePrediction()
│       ├── calculateTrend()
│       └── calculateConfidenceLevel()
│
├── routes/
│   ├── upload.routes.js (Enhanced)
│   │   └── + GET /api/upload/user-marks
│   ├── analytics.routes.js (Enhanced)
│   │   └── + GET /api/analytics/user
│   └── prediction.routes.js (Enhanced)
│       └── + GET /api/predictions/user/subjects
│
└── models/
    ├── QuizScore.js (Used as-is)
    ├── Student.js
    ├── ExtractedData.js
    └── index.js
```

## 🎨 UI Layout

```
UPLOAD PAGE
===========

┌─────────────────────────────────────────────┐
│               Upload Marks                  │
│  Click or drag files to upload              │
│  [Drag & Drop Zone with upload icon]        │
│  [Progress Bar]                             │
│  ┌─────────────────────────────────────────┐│
│  │ Upload History                          ││
│  ├─────────────────┬────────┬────────┬─────┤│
│  │ File Name       │ Status │Records │Date ││
│  ├─────────────────┼────────┼────────┼─────┤│
│  │ marks.pdf       │ ✓ OK   │ 50     │ 2/1 ││
│  │ semester2.csv   │ ✓ OK   │ 35     │ 2/2 ││
│  └─────────────────┴────────┴────────┴─────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Your Analytics Summary                  ││
│  ├─────┬──────────┬──────────┬───────────┤│
│  │ GPA │ Average  │ Marks    │ Subjects  ││
│  │3.05 │ 85.75%   │ 50       │ 8         ││
│  └─────┴──────────┴──────────┴───────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Subject Performance                     ││
│  ├──────────────┬─────────┬──────┬──────┤│
│  │ Subject      │ Avg     │Grade │Count ││
│  ├──────────────┼─────────┼──────┼──────┤│
│  │ IT1140       │ 88.5%   │ A    │ 2    ││
│  │ IT1130       │ 83%     │ B+   │ 2    ││
│  └──────────────┴─────────┴──────┴──────┘│
│                                             │
└─────────────────────────────────────────────┘


ANALYTICS PAGE
==============

┌──────────────────────────────────────────────┐
│         📊 Your Analytics Dashboard          │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────┐  ┌────────┐  ┌──────┐  ┌────────┐│
│  │ GPA  │  │Average │  │Marks │  │Subjects││
│  │ 3.05 │  │ 85.75% │  │  50  │  │   8    ││
│  │/4.0  │  │   ▓▓▓  │  │      │  │        ││
│  └──────┘  └────────┘  └──────┘  └────────┘│
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📚 Subject Performance                  │ │
│  ├──────────────┬────────┬──────┬──────────┤ │
│  │Subject       │Average │Grade │Range    │ │
│  ├──────────────┼────────┼──────┼──────────┤ │
│  │IT1140        │88.5%   │ A    │85-92    │ │
│  │──────────────▓▓▓▓▓▓▓▓ │      │         │ │
│  │IT1130        │83.0%   │B+    │78-88    │ │
│  │──────────────▓▓▓▓▓▓─  │      │         │ │
│  │SE1020        │95.0%   │A+    │95-95    │ │
│  │──────────────▓▓▓▓▓▓▓▓▓│      │         │ │
│  └──────────────┴────────┴──────┴──────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📈 Subject Scores Overview              │ │
│  │     ▓▓▓▓▓▓▓                             │ │
│  │     ▓▓▓▓▓▓▓     ▓▓▓▓▓▓▓▓▓▓             │ │
│  │ IT1 ▓▓▓▓▓▓▓ IT1 ▓▓▓▓▓▓▓▓▓▓ SE1 ▓▓▓▓▓▓│ │
│  │     └────┴──────┴───────┴───────┴───   │ │
│  │     0%  50%    75%    100%             │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📝 Recent Marks                         │ │
│  │ ● 85  | IT1140 | Quiz    | Feb 1       │ │
│  │ ● 92  | IT1140 | Exam    | Feb 5       │ │
│  │ ● 78  | IT1130 | Quiz    | Feb 3       │ │
│  │ ● 88  | IT1130 | Exam    | Feb 8       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [Refresh] [Export to Excel] [Upload More] │
│                                              │
└──────────────────────────────────────────────┘
```

## 🔗 API Connection Map

```
FRONTEND COMPONENTS ─────────────────► BACKEND ENDPOINTS
    ↓                                        ↓
    │                                        │
MultipleFileUpload                    POST /api/upload/upload
    └──────────────────────────────────────┬─────────────────┘
                                           │
    ┌──────────────────────────────────────┘
    │
    ▼
GET /api/upload/user-marks (Alternative)
    │
    ▼
UserAnalyticsDashboard ◀────────────── GET /api/analytics/user
    │                                    ↑
    │                    ┌───────────────┘
    │                    │
    └─────────────────── GET /api/upload/user-marks


PREDICTION FLOW
===============

PredictionPage
    │
    ├──▶ GET /api/predictions/user/subjects
    │        (Get available subjects with marks)
    │
    └──▶ POST /api/predictions/generate
             (Generate prediction using marks)
                    ↓
             PredictionService
                    ↓
             Calculation Engine
                    ↓
             Display Results
```

## 📊 GPA Color Coding

```
GPA     Color       Grade   Description
───────────────────────────────────────
3.5-4.0  🟢 Green    A+/A   Excellent
3.0-3.5  🟢 Green    A/B+   Very Good
2.5-3.0  🟡 Yellow   B      Good
2.0-2.5  🟠 Orange   B-/C+  Fair
1.0-2.0  🟠 Orange   C      Needs Improvement
0.0-1.0  🔴 Red      D/F    Concerning
```

## 📈 Performance Metrics Display

```
DASHBOARD DISPLAYS:
═══════════════════

1. GPA Card
   ┌─────────────────┐
   │  GPA            │
   │  3.05/4.0       │
   │  ▲ Excellent    │
   └─────────────────┘

2. Average Score Card
   ┌─────────────────┐
   │  Average Score  │
   │  85.75%         │
   │  ▓▓▓▓▓▓▓▓▓░    │
   └─────────────────┘

3. Subject Performance
   ┌──────────────────────┐
   │ IT1140: 88.5% (A)   │
   │ ▓▓▓▓▓▓▓▓▓░░░░░░░░   │
   │                      │
   │ IT1130: 83.0% (B+)  │
   │ ▓▓▓▓▓▓▓░░░░░░░░░░   │
   │                      │
   │ SE1020: 95.0% (A+)  │
   │ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░   │
   └──────────────────────┘

4. Grade Distribution
   A+ ████ (2)
   A  ██████ (5)
   B+ ████ (3)
   B  ██ (1)
   C  █ (1)
```

## ✨ Key Integration Points

```
1. AUTHENTICATION
   └─→ req.user.id extracted from JWT
   └─→ userId linked to all operations
   └─→ Users can only access own data

2. FILE PROCESSING
   └─→ Upload → Parse → Normalize → Validate → Store
   └─→ Automatic Student record creation
   └─→ QuizScore linked with userId

3. ANALYTICS CALCULATION
   └─→ Query QuizScore by userId
   └─→ Group by subject
   └─→ Calculate statistics
   └─→ Compute GPA on 0-4.0 scale

4. PREDICTION ENGINE
   └─→ Use uploaded marks as input
   └─→ Apply study hours weight
   └─→ Calculate trend
   └─→ Generate predictions

5. EXPORT FUNCTIONALITY
   └─→ Format data to Excel
   └─→ Include summary & details
   └─→ Download with timestamp
```

---

This visual guide helps understand how all components work together!
