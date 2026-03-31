# 🚀 QUICK START GUIDE - StudySmart Authentication System

## ✨ What Was Implemented

A complete **secure authentication and role-based access control system** for StudySmart with:
- SLIIT email validation (IT12345678@my.sliit.lk format)
- JWT-based authentication
- Admin & Student role separation
- Hardcoded admin credentials
- Toast notifications
- Admin dashboard with analytics

---

## 🎯 CREDENTIALS FOR TESTING

### Admin Account (Hardcoded)
```
Email:    admin@nidu.sliit.lk
Password: nidu@123
Expected Redirect: /admin-dashboard
```

### Create Student Account
```
Email:    IT21345678@my.sliit.lk  (Any valid SLIIT format)
Password: Any password (min 6 chars)
Expected Redirect: /dashboard
```

---

## 🏃 RUNNING THE APPLICATION

### Terminal 1: Start Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Terminal 2: Start Frontend  
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Browser
Navigate to: **http://localhost:3000**

---

## 🧪 TEST FLOWS

### Flow 1: Admin Login
1. Click "Login" (if at register page)
2. Email: `admin@nidu.sliit.lk`
3. Password: `nidu@123`
4. Click "Login"
5. ✅ Redirected to `/admin-dashboard`
6. ✅ Toast: "✅ Welcome back!"

### Flow 2: Student Registration
1. Click "Register"
2. Full Name: `John Doe`
3. Email: `IT21345678@my.sliit.lk` (change numbers)
4. Password: `Test@123`
5. Confirm: `Test@123`
6. Click "Create Account"
7. ✅ Redirected to `/dashboard`
8. ✅ Toast: "✅ Account created successfully!"

### Flow 3: Invalid Email
1. Go to Register
2. Try email: `student@gmail.com`
3. ❌ Error shows: "Email must be in SLIIT format"
4. Toast: "❌ Invalid email format"

### Flow 4: Admin Registration Prevention
1. Go to Register
2. Email: `admin@nidu.sliit.lk`
3. Password: `test123`
4. Click Register
5. ❌ Error: "Admin registration is not allowed"

### Flow 5: Wrong Admin Password
1. Login page
2. Email: `admin@nidu.sliit.lk`
3. Password: `wrongpass`
4. ❌ Error: "Invalid email or password"

---

## 📊 ADMIN DASHBOARD FEATURES

Once logged in as admin:

**Key Metrics:**
- Total Students count
- Average class score
- Excellent students count
- At-risk students count

**Charts:**
- 📈 Performance Trend (weekly)
- 📊 Score Distribution (pie chart)

**Student Table:**
- Search by email
- Filter by subject
- View scores & predictions
- GPA and status indicators
- Color-coded performance tags

---

## 🔑 IMPORTANT FILES

### Backend
```
✅ backend/src/models/User.js
   - SLIIT email validation
   - Password hashing
   - Role field (student/admin)

✅ backend/src/controllers/auth.controller.js
   - Admin hardcode check
   - SLIIT validation
   - JWT token generation

✅ backend/src/middleware/role.js (NEW)
   - Role-based access control

✅ backend/src/routes/auth.routes.js
   - Register, Login, Me, Logout endpoints
```

### Frontend
```
✅ frontend/src/pages/LoginPage.jsx
   - Login with toast notifications
   - Role-based redirection

✅ frontend/src/pages/RegisterPage.jsx (REWRITTEN)
   - SLIIT email validation
   - Simple one-page form

✅ frontend/src/pages/AdminDashboard.jsx (NEW)
   - Admin-only dashboard
   - Students table with analytics

✅ frontend/src/context/AuthContext.jsx
   - Global auth state
   - Login/register/logout methods

✅ frontend/src/components/common/PrivateRoute.jsx
   - Route protection with role checks

✅ frontend/src/App.jsx
   - Updated routes
   - Admin dashboard route
```

---

## ✅ VALIDATION RULES

### Email
- **Student:** `^IT\d{8}@my\.sliit\.lk$`
  - Valid: `IT21345678@my.sliit.lk`
  - Invalid: `student@gmail.com`
  
- **Admin:** Hardcoded `admin@nidu.sliit.lk` only

### Password
- Minimum 6 characters
- Any combination of characters
- Hashed with bcrypt before storage

### Registration
- ✅ Only SLIIT emails allowed
- ❌ Admin email cannot register
- ✅ Automatic role assignment: "student"

### Login
- ✅ Admin email + password = admin role
- ✅ Student email + password = student role from DB
- ✅ JWT token valid for 7 days

---

## 🚨 TROUBLESHOOTING

### "Cannot connect to server"
- ✅ Ensure backend is running on port 5000
- ✅ Check MongoDB/PostgreSQL connections
- ✅ See backend logs for errors

### "Email already registered"
- ✅ Use a different student ID number (e.g., IT21345679@my.sliit.lk)
- ✅ Or clear MongoDB and restart

### Admin dashboard shows 404
- ✅ Ensure you're logged in as admin
- ✅ Token should contain `role: "admin"`
- ✅ Check browser console for errors

### Toast notifications not showing
- ✅ react-hot-toast is already installed
- ✅ Check if any CSS conflicts exist
- ✅ Verify console for JS errors

---

## 🔐 SECURITY CHECKLIST

✅ Passwords hashed with bcrypt
✅ JWT tokens with expiration
✅ Role-based access control
✅ SLIIT email format validation
✅ Admin credentials hardcoded (not registered)
✅ Error messages don't leak sensitive info
✅ Token stored securely in localStorage
✅ Axios auto-attaches token to requests

---

## 📈 NEXT STEPS (Optional)

### To Add to Existing Routes
Apply data isolation to protected routes:

```javascript
// In any protected route controller
if (req.user.role === 'student') {
  // Filter by student ID
  query.userId = req.user.id;
}
// Admin sees all data
```

### To Deploy
1. Set environment variables (JWT_SECRET, MONGODB_URI, etc.)
2. Move admin credentials to .env file
3. Enable HTTPS
4. Add email verification
5. Implement refresh tokens
6. Add rate limiting

---

## 📞 SUPPORT

If you encounter issues:
1. Check backend logs: `npm start` output
2. Check browser console: Press F12
3. Verify MongoDB/PostgreSQL connections
4. Ensure ports 3000 and 5000 are available
5. Review error messages in toast notifications

---

**Status:** ✅ COMPLETE & READY TO TEST

**Last Updated:** March 31, 2026

**Contact:** StudySmart Development Team
