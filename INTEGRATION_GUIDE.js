/**
 * Quick Integration Guide for StudySmart Upload & Analytics
 * 
 * This file shows how to integrate the new components into existing pages.
 */

// ============================================================================
// 1. IN YOUR UPLOAD PAGE (UploadPage.jsx)
// ============================================================================

import MultipleFileUpload from '../components/upload/MultipleFileUpload';

export default function UploadPage() {
  const handleUploadComplete = (result) => {
    console.log('Upload completed:', result);
    // Refresh page or update state
  };

  const handleAnalyticsUpdate = (analytics) => {
    console.log('Analytics updated:', analytics);
    // Update your dashboard or display
  };

  return (
    <div>
      <MultipleFileUpload 
        onUploadComplete={handleUploadComplete}
        onAnalyticsUpdate={handleAnalyticsUpdate}
      />
    </div>
  );
}

// ============================================================================
// 2. IN YOUR ANALYTICS PAGE (AnalyticsPage.jsx or new page)
// ============================================================================

import UserAnalyticsDashboard from '../components/analytics/UserAnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div>
      <UserAnalyticsDashboard />
    </div>
  );
}

// ============================================================================
// 3. ACCESSING USER MARKS IN YOUR COMPONENTS
// ============================================================================

import uploadService from '../services/upload.service';
import analyticsService from '../services/analytics.service';

async function getMyMarks() {
  // Get marks with aggregated stats
  const response = await uploadService.getUserMarks();
  console.log(response.data);
  // Returns: {
  //   userId: "xxx",
  //   subjects: [{ subject, average, grade, count, min, max }],
  //   totalMarks: 50,
  //   averageMarks: 75.5,
  //   gpa: 2.85,
  //   marks: [{ id, subject, score, type, date }]
  // }
}

async function getMyAnalytics() {
  // Get comprehensive analytics
  const response = await analyticsService.getUserAnalytics();
  console.log(response.data);
  // Returns: {
  //   userId: "xxx",
  //   overallAverage: 75.5,
  //   gpa: 2.85,
  //   totalMarks: 50,
  //   subjects: [{ subject, average, count, max, min, grade, trend }],
  //   recentActivity: [{ subject, score, type, date }]
  // }
}

// ============================================================================
// 4. EXAMPLE: ADD ANALYTICS CARD TO DASHBOARD
// ============================================================================

import { Card, Row, Col, Statistic, Button, Empty, Spin } from 'antd';
import { useState, useEffect } from 'react';
import uploadService from '../services/upload.service';

function AnalyticsCard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await uploadService.getUserMarks();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin />;
  if (!analytics) return <Empty description="No data" />;

  return (
    <Card title="📊 Your Analytics">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic 
            title="GPA" 
            value={analytics.gpa} 
            suffix="/4.0"
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Average" 
            value={analytics.averageMarks} 
            suffix="%"
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Total Marks" 
            value={analytics.totalMarks}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Subjects" 
            value={analytics.subjects?.length || 0}
          />
        </Col>
      </Row>
      <Button 
        type="primary" 
        style={{ marginTop: 16 }}
        onClick={() => window.location.href = '/analytics'}
      >
        View Full Analytics
      </Button>
    </Card>
  );
}

// ============================================================================
// 5. BACKEND API CALLS REFERENCE
// ============================================================================

/*
UPLOAD ENDPOINTS:
================

Upload a file:
POST /api/upload/upload
  Headers: Authorization: Bearer TOKEN
  Body: FormData { file, studentId (optional) }
  Response: { success, data: { extractionId, recordsCount }, message }

Get user's marks:
GET /api/upload/user-marks
  Headers: Authorization: Bearer TOKEN
  Response: { success, data: { 
    userId, 
    subjects: [{subject, average, grade, count, min, max}],
    totalMarks, 
    averageMarks, 
    gpa,
    marks: [{id, subject, score, type, date}]
  }}

Get specific student's marks:
GET /api/upload/student-marks/:studentId
  Headers: Authorization: Bearer TOKEN
  Response: { success, data: { 
    studentId, 
    student: {id, name, number},
    marks: [{subject, marks, assessmentType, date, id}]
  }}

ANALYTICS ENDPOINTS:
====================

Get user analytics:
GET /api/analytics/user
  Headers: Authorization: Bearer TOKEN
  Response: { success, data: {
    userId,
    overallAverage,
    gpa,
    totalMarks,
    subjects: [{
      subject,
      average,
      count,
      max,
      min,
      grade,
      trend: [scores...]
    }],
    recentActivity: [{subject, score, type, date}]
  }}

PREDICTION ENDPOINTS:
====================

Get user's subjects:
GET /api/predictions/user/subjects
  Headers: Authorization: Bearer TOKEN
  Response: { success, data: [{
    subject,
    average,
    count,
    highest,
    lowest
  }]}

Generate prediction:
POST /api/predictions/generate
  Headers: Authorization: Bearer TOKEN
  Body: { subject, scores (optional), marksData (optional) }
  Response: { success, data: {
    predictedScore,
    confidence,
    recommendedHours,
    currentStats: {averageScore, grade, passStatus},
    factors: {quizAverage, studyImpact, trend}
  }}
*/

// ============================================================================
// 6. GPA CALCULATION REFERENCE
// ============================================================================

/*
GPA = ((average_percentage - 40) / 60) * 4.0

Examples:
- 100% → 4.0 (Excellent)
- 90%  → 3.33
- 80%  → 2.67
- 75%  → 2.33 (Good)
- 70%  → 2.0
- 60%  → 1.33 (Fair)
- 50%  → 0.67
- 40%  → 0.0 (Failing)

Grade Mapping:
- A+ (90-100) → 4.0
- A  (80-89)  → 3.7
- B+ (70-79)  → 3.3
- B  (65-69)  → 3.0
- C+ (60-64)  → 2.7
- C  (55-59)  → 2.3
- D  (50-54)  → 2.0
- F  (<50)    → 0.0
*/

// ============================================================================
// 7. FILE FORMATS SUPPORTED
// ============================================================================

/*
Supported Formats:
- PDF (.pdf)
- CSV (.csv)
- Excel (.xls, .xlsx)

Expected Column Names:
- Student ID: "Registration No", "studentNumber", "student_number", "reg_no", "id"
- Subject: "subject", "Subject", "module", "Module", "course", "Course"
- Score: "score", "Score", "marks", "Marks", "CA Marks", "Score (%)"
- Type: "type", "Type", "assessmentType"
- Grade: "grade", "Grade"

Example CSV:
Registration No,Subject,Score,Type,Grade
IT23145870,IT1140,85,quiz,A
IT23145870,IT1130,92,exam,A+
IT23145871,IT1140,75,quiz,B+
*/

// ============================================================================
// 8. TESTING WITH CURL
// ============================================================================

/*
# Test upload
curl -X POST http://localhost:5000/api/upload/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@marks.pdf" \
  -F "studentId=IT23145870"

# Get user marks
curl -X GET http://localhost:5000/api/upload/user-marks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user analytics
curl -X GET http://localhost:5000/api/analytics/user \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user subjects for prediction
curl -X GET http://localhost:5000/api/predictions/user/subjects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate prediction
curl -X POST http://localhost:5000/api/predictions/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"IT1140"}'
*/

export {};
