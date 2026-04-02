# 📚 StudySmart - Complete Upload & Analytics System

## 🎯 Overview

This implementation provides a **complete, production-ready system** for students to:
1. **Upload multiple mark documents** (PDF, CSV, Excel)
2. **Extract subject marks** automatically
3. **View comprehensive analytics** with GPA (0-4.0 scale)
4. **Get predictions** based on their marks
5. **Export analytics** to Excel

---

## 🚀 Quick Start

### For Students:

**Step 1: Upload Marks**
```
Go to → Upload Page → Drag & drop mark sheet (PDF/Excel/CSV)
↓
System extracts all subjects and marks
↓
Records saved to database
```

**Step 2: View Analytics**
```
Go to → Analytics Dashboard
↓
See:
- GPA (0-4.0 scale)
- Average Score
- Subject Breakdown
- Recent Marks
```

**Step 3: Get Predictions**
```
Go to → Predictions → Select Subject
↓
System uses your uploaded marks
↓
Get predicted score & study recommendations
```

---

## 💾 Database Schema

### QuizScore Table
```sql
CREATE TABLE quiz_scores (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255),           -- Links to authenticated user
  student_id INTEGER,              -- Links to Student table
  subject VARCHAR(255),
  score DECIMAL(5,2),              -- 0-100
  type VARCHAR(50),                -- 'quiz', 'exam', 'final', etc.
  date TIMESTAMP,
  source_file VARCHAR(255),
  grade VARCHAR(10),
  status VARCHAR(50),
  extracted_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_user_id_subject ON quiz_scores(user_id, subject);
CREATE INDEX idx_date ON quiz_scores(date);
```

### Student Table
```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  student_number VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  program VARCHAR(100),
  year INTEGER,
  semester INTEGER,
  branch VARCHAR(50),
  metadata JSONB,              -- Includes userId from uploads
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔌 API Endpoints

### Upload Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/upload/upload` | ✅ | Upload mark sheet |
| GET | `/api/upload/user-marks` | ✅ | Get user's uploaded marks |
| GET | `/api/upload/student-marks/:id` | ✅ | Get student's marks |
| GET | `/api/upload/history` | ✅ | Get upload history (admin) |
| GET | `/api/upload/stats` | ✅ | Get upload statistics |

### Analytics Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/analytics/user` | ✅ | Get user analytics |
| GET | `/api/analytics/student/:id` | ✅ | Get student dashboard |
| GET | `/api/analytics/subject/:subject` | ✅ | Get subject analytics |

### Prediction Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/predictions/user/subjects` | ✅ | Get user's subjects |
| POST | `/api/predictions/generate` | ✅ | Generate prediction |
| GET | `/api/predictions/history` | ✅ | Get prediction history |

---

## 📊 Data Flow Diagram

```
┌─────────────────────┐
│   Student Uploads   │
│   Mark Sheet (PDF)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  Backend File Processor     │
│  - Extract marks            │
│  - Normalize data           │
│  - Validate scores          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Create Database Records    │
│  - Student (if not exists)  │
│  - QuizScore with userId    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Analytics Calculation      │
│  - Group by subject         │
│  - Calculate averages       │
│  - Calculate GPA (0-4.0)    │
│  - Assign grades            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Display Dashboard          │
│  - Show GPA, avg, subjects  │
│  - Show trends, charts      │
│  - Enable export to Excel   │
└─────────────────────────────┘
```

---

## 🧮 GPA Calculation

### Formula
```
GPA = ((average_percentage - 40) / 60) * 4.0
```

### Conversion Table
| Average % | GPA | Grade |
|-----------|-----|-------|
| 95-100 | 3.67-4.0 | A+ |
| 85-94 | 3.0-3.67 | A |
| 75-84 | 2.33-3.0 | B+ |
| 65-74 | 1.67-2.33 | B |
| 55-64 | 1.0-1.67 | C+ |
| 50-54 | 0.67-1.0 | D |
| <50 | 0 | F |

### Example Calculation
```
If student has marks: 85, 92, 78, 88

Average = (85 + 92 + 78 + 88) / 4 = 85.75%

GPA = ((85.75 - 40) / 60) * 4.0
    = (45.75 / 60) * 4.0
    = 0.7625 * 4.0
    = 3.05

Result: GPA 3.05 ≈ Grade A
```

---

## 📁 File Upload Format

### Supported Formats
- ✅ PDF (.pdf)
- ✅ CSV (.csv)
- ✅ Excel (.xls, .xlsx)

### Required Columns (Any Variant)
```
Student ID:     Registration No | studentNumber | student_number | reg_no | id
Subject:        subject | Subject | module | Module | course | Course
Score:          score | Score | marks | Marks | CA Marks | Score (%)
Type (optional): type | Type | assessmentType | AssessmentType
```

### Example CSV Format
```
Registration No,Subject,Score,Type,Grade
IT23145870,IT1140,85,Quiz,A
IT23145870,IT1140,92,Exam,A+
IT23145870,IT1130,78,Quiz,B+
IT23145871,IT1130,88,Exam,A
IT23145871,SE1020,95,Quiz,A+
```

---

## 🖥️ Frontend Components

### 1. MultipleFileUpload Component
**Location**: `frontend/src/components/upload/MultipleFileUpload.jsx`

**Features**:
- Drag-and-drop file upload
- Multiple file support
- Upload progress tracking
- Upload history display
- Auto-refresh analytics

**Usage**:
```jsx
import MultipleFileUpload from './components/upload/MultipleFileUpload';

<MultipleFileUpload 
  onUploadComplete={(data) => console.log(data)}
  onAnalyticsUpdate={(analytics) => console.log(analytics)}
/>
```

### 2. UserAnalyticsDashboard Component
**Location**: `frontend/src/components/analytics/UserAnalyticsDashboard.jsx`

**Features**:
- KPI cards (GPA, Average, Total Marks)
- Subject performance table
- Bar chart visualization
- Recent marks list
- Excel export

**Usage**:
```jsx
import UserAnalyticsDashboard from './components/analytics/UserAnalyticsDashboard';

<UserAnalyticsDashboard />
```

---

## 🔧 Backend Services

### Analytics Service
**File**: `backend/src/services/analytics.service.js`

**Methods**:
- `calcGPA(scores)` - Calculate 0-4.0 GPA
- `getGrade(score)` - Get letter grade
- `getSubjectPerformance(studentId)` - Subject breakdown
- `buildProfileAnalytics(studentId, userId)` - Full analytics

### Prediction Service
**File**: `backend/src/services/prediction.service.js`

**Methods**:
- `generatePrediction(hours, scores)` - Generate score prediction
- `calculateTrend(scores)` - Calculate trend
- `calculateConfidenceLevel(hours, count)` - Confidence score

---

## 🔐 Authentication & Authorization

### Required Auth
- **User Authentication**: JWT token
- **userId Extraction**: From `req.user.id` or `req.user._id`
- **Scope**: Users can only see their own data

### Verification
```javascript
// Backend automatically checks:
// 1. User is authenticated
// 2. userId is extracted from token
// 3. All marks are linked to userId
// 4. Users can't access other users' data
```

---

## 🧪 Testing

### Quick Test
```bash
# 1. Start backend
cd backend
npm start

# 2. Start frontend
cd frontend
npm start

# 3. Create test account and login

# 4. Upload sample mark sheet

# 5. Check analytics page - GPA should display
```

### Full Testing Checklist
See `TESTING_CHECKLIST.md`

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `UPLOAD_ANALYTICS_IMPLEMENTATION.md` | Complete technical implementation details |
| `INTEGRATION_GUIDE.js` | Code examples and integration instructions |
| `TESTING_CHECKLIST.md` | Comprehensive testing procedures |
| `README.md` | This file - Quick reference guide |

---

## 🚨 Error Handling

### Common Errors & Solutions

**Error: "No marks data found"**
- Solution: Upload a mark sheet first

**Error: "User not authenticated"**
- Solution: Login and ensure valid token

**Error: "Invalid file format"**
- Solution: Use PDF, CSV, or Excel format only

**Error: "GPA not calculating"**
- Solution: Ensure marks are stored as numbers in database

---

## 🔍 Database Queries

### View User's Marks
```sql
SELECT 
  subject,
  AVG(score) as avg_score,
  COUNT(*) as count,
  MAX(score) as max_score,
  MIN(score) as min_score
FROM quiz_scores
WHERE user_id = 'USER_ID'
GROUP BY subject
ORDER BY avg_score DESC;
```

### Calculate User GPA
```sql
SELECT 
  user_id,
  AVG(score) as avg_percentage,
  ROUND(((AVG(score) - 40) / 60.0) * 4.0, 2) as gpa
FROM quiz_scores
WHERE user_id = 'USER_ID'
GROUP BY user_id;
```

---

## 🚀 Deployment Checklist

- [ ] Backend database migrations run
- [ ] All environment variables set
- [ ] Frontend API endpoint configured
- [ ] Authentication middleware enabled
- [ ] File upload directory created
- [ ] CORS settings configured
- [ ] SSL certificate installed
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Load testing completed

---

## 📞 Support

### Issues?
1. Check `TESTING_CHECKLIST.md` for common problems
2. Review `INTEGRATION_GUIDE.js` for API usage
3. Check backend logs: `docker logs backend`
4. Check browser console for frontend errors

### Files to Review
- Backend: `src/controllers/upload.controller.js`
- Backend: `src/controllers/analytics.controller.js`
- Frontend: `components/upload/MultipleFileUpload.jsx`
- Frontend: `components/analytics/UserAnalyticsDashboard.jsx`

---

## 📈 Performance Metrics

### Expected Response Times
- Upload processing: < 5 seconds
- Analytics fetch: < 2 seconds
- Prediction generation: < 3 seconds
- Export to Excel: < 5 seconds

### Database Indexes
- `quiz_scores(user_id, subject)` - Analytics queries
- `quiz_scores(date)` - Trend queries
- `students(student_number)` - Lookup queries

---

## 🎨 UI Features

### Dashboard KPIs
- **GPA**: Color-coded (Green ≥3.0, Yellow 2.5-3.0, Red <2.5)
- **Average Score**: Percentage with progress bar
- **Total Marks**: Count of all uploaded marks
- **Subjects**: Number of unique subjects

### Subject Table
- Subject name
- Average score with progress bar
- Grade (A+, A, B+, etc.) with color
- Count of marks
- Min-Max range

### Charts
- Bar chart: Subject scores comparison
- List: Recent marks with avatars

---

## 🔄 Continuous Integration

### Code Quality
```bash
# Lint backend
npm run lint

# Test backend
npm test

# Build frontend
npm run build
```

---

## 📝 Version History

### v1.0.0 - Initial Release
- ✅ File upload (PDF, CSV, Excel)
- ✅ Mark extraction
- ✅ Analytics dashboard
- ✅ GPA calculation (0-4.0)
- ✅ Subject breakdown
- ✅ Prediction integration
- ✅ Export to Excel

---

## 📄 License

All rights reserved - StudySmart Project

---

## ✨ Summary

This implementation provides everything needed to:
1. Upload marks in various formats
2. Automatically extract and store data
3. Calculate accurate GPA on 0-4.0 scale
4. Display comprehensive analytics
5. Generate predictions
6. Export data for analysis

**Status**: ✅ Production Ready

---

**Last Updated**: April 2, 2026
**Developer**: StudySmart Team
**Documentation**: Complete & Up-to-date
