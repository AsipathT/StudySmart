# StudySmart Upload & Analytics - Testing Checklist

## ✅ Backend Testing

### 1. Upload Functionality
- [ ] Test file upload endpoint with PDF
- [ ] Test file upload endpoint with CSV
- [ ] Test file upload endpoint with Excel
- [ ] Verify userId is captured from auth token
- [ ] Verify QuizScore records are created with userId
- [ ] Verify student records are created/updated
- [ ] Test multiple sequential uploads

**Expected:**
- Files processed successfully
- Records created in database
- userId linked to all records

### 2. User Marks Retrieval
- [ ] GET `/api/upload/user-marks` returns user's marks
- [ ] Response includes GPA calculation
- [ ] Response includes subject grouping
- [ ] Response includes averages per subject

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "subjects": [
      {
        "subject": "IT1140",
        "average": 87.5,
        "count": 3,
        "max": 95,
        "min": 80
      }
    ],
    "totalMarks": 50,
    "averageMarks": 75.5,
    "gpa": 2.85
  }
}
```

### 3. Analytics Retrieval
- [ ] GET `/api/analytics/user` returns user analytics
- [ ] GPA calculation is correct (0-4.0 scale)
- [ ] Subject performance calculated correctly
- [ ] Recent activity shows last 10 marks

**GPA Validation:**
- 100% average → 4.0 GPA ✓
- 75% average → 2.33 GPA ✓
- 60% average → 1.33 GPA ✓
- 40% average → 0.0 GPA ✓

### 4. Prediction Generation
- [ ] GET `/api/predictions/user/subjects` lists all subjects
- [ ] POST `/api/predictions/generate` uses uploaded marks
- [ ] Prediction calculation includes quiz averages
- [ ] Confidence level calculated correctly

**Expected:**
```json
{
  "success": true,
  "data": {
    "predictedScore": 82,
    "confidence": "High",
    "recommendedHours": 0,
    "currentStats": {
      "averageScore": 85,
      "currentGrade": "A",
      "passStatus": "Pass"
    }
  }
}
```

---

## ✅ Frontend Testing

### 1. Upload Component
- [ ] MultipleFileUpload component renders
- [ ] Can drag and drop files
- [ ] Shows upload progress
- [ ] Displays upload history
- [ ] Shows success/failure status

### 2. Analytics Dashboard
- [ ] UserAnalyticsDashboard renders
- [ ] Displays GPA card
- [ ] Displays average score
- [ ] Shows subject table
- [ ] Subject grades are color-coded
- [ ] Bar chart displays correctly
- [ ] Recent marks list shows
- [ ] Export to Excel works

### 3. Data Integration
- [ ] Upload refreshes analytics automatically
- [ ] Analytics page loads user data
- [ ] Multiple uploads aggregate correctly
- [ ] GPA updates after new upload

### 4. Responsive Design
- [ ] Components work on mobile (xs)
- [ ] Components work on tablet (md)
- [ ] Components work on desktop (lg)
- [ ] No layout shifts

---

## 🔍 Database Verification

### 1. Check QuizScore Records
```sql
-- Verify userId is set
SELECT id, "userId", "studentId", subject, score 
FROM quiz_scores 
WHERE "userId" IS NOT NULL 
LIMIT 5;

-- Should show userId linked to scores
```

### 2. Check Student Records
```sql
-- Verify students are created
SELECT id, "studentNumber", name, email 
FROM students 
WHERE metadata->>'source' = 'file_upload' 
LIMIT 5;
```

### 3. Verify GPA Calculation
```sql
-- Calculate GPA for a user
SELECT 
  user_id,
  AVG(score) as avg_score,
  CASE 
    WHEN AVG(score) >= 100 THEN 4.0
    WHEN AVG(score) >= 75 THEN 2.33
    WHEN AVG(score) >= 60 THEN 1.33
    WHEN AVG(score) >= 40 THEN 0.0
  END as calculated_gpa
FROM quiz_scores
GROUP BY user_id;
```

---

## 🧪 API Testing

### Using cURL:

#### Upload Test
```bash
curl -X POST http://localhost:5000/api/upload/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_marks.pdf"
```

#### User Marks Test
```bash
curl -X GET http://localhost:5000/api/upload/user-marks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### User Analytics Test
```bash
curl -X GET http://localhost:5000/api/analytics/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### User Subjects Test
```bash
curl -X GET http://localhost:5000/api/predictions/user/subjects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman:

1. **Create Collection**: StudySmart Upload Analytics
2. **Add Authorization**: Token authentication
3. **Create Requests**:
   - POST Upload File
   - GET User Marks
   - GET User Analytics
   - GET User Subjects
   - POST Generate Prediction

---

## 📊 Data Sample for Testing

### Sample CSV:
```csv
Registration No,Subject,Score,Type,Grade,Date
IT23145870,IT1140,85,quiz,A,2024-01-15
IT23145870,IT1140,92,exam,A+,2024-01-20
IT23145870,IT1130,78,quiz,B+,2024-01-18
IT23145870,IT1130,88,exam,A,2024-01-22
IT23145870,SE1020,95,quiz,A+,2024-01-17
```

### Expected Results:
- **IT1140**: Average 88.5%, Grade A
- **IT1130**: Average 83%, Grade B+
- **SE1020**: Average 95%, Grade A+
- **Overall Average**: 88.83%
- **Overall GPA**: 3.53

---

## 🚀 End-to-End Flow Testing

1. **User Logs In**
   - [ ] Authentication token generated
   - [ ] userId captured

2. **Upload Marks**
   - [ ] Select PDF/Excel file
   - [ ] Upload completes
   - [ ] Success message shown
   - [ ] Records in database

3. **View Analytics**
   - [ ] Navigate to analytics page
   - [ ] Data loads from `/api/upload/user-marks`
   - [ ] GPA displayed correctly
   - [ ] Subjects listed with averages

4. **Generate Prediction**
   - [ ] Select subject
   - [ ] Prediction generated using uploaded marks
   - [ ] Confidence level shown
   - [ ] Recommendations displayed

5. **Export Data**
   - [ ] Click export button
   - [ ] Excel file downloaded
   - [ ] File contains summary and details
   - [ ] All data present

---

## ⚠️ Edge Cases to Test

- [ ] Upload file with no marks data
- [ ] Upload file with invalid student ID
- [ ] Upload same file twice (duplicate handling)
- [ ] Upload with 0% score
- [ ] Upload with score > 100%
- [ ] Upload with missing subject column
- [ ] User with no uploads yet
- [ ] User with only one mark
- [ ] Generate prediction with one subject
- [ ] Export with no data

---

## 🐛 Known Issues & Fixes

### Issue: GPA Not Calculating Correctly
**Solution**: Check QuizScore.score is stored as number, not string

### Issue: userId Not Linked
**Solution**: Verify req.user is populated by auth middleware

### Issue: Analytics Page Blank
**Solution**: Check backend /analytics/user endpoint is responding

### Issue: Upload History Not Updating
**Solution**: Ensure fetchUserAnalytics() is called after each upload

### Issue: Grades Not Color-Coded
**Solution**: Verify getGradeColor() function in UserAnalyticsDashboard

---

## ✨ Validation Criteria

- [ ] All uploads successfully extract marks
- [ ] All marks linked to correct userId
- [ ] GPA calculated on 0-4.0 scale
- [ ] Analytics page shows all data correctly
- [ ] Predictions use uploaded marks
- [ ] Export generates valid Excel file
- [ ] No data loss on multiple uploads
- [ ] All API endpoints return correct status codes
- [ ] Error handling displays user-friendly messages
- [ ] Frontend components responsive on all devices

---

## 📝 Sign-Off

- Backend Developer: _____________
- Frontend Developer: _____________
- QA Tester: _____________
- Date: _____________

---

## Notes

Use this checklist to verify all functionality before deploying to production.
