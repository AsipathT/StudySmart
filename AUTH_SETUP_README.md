# Study Buddy Finder - Authentication System

This is a complete authentication system for the Study Buddy Finder application, built with MERN stack (MongoDB, Express, React, Node.js).

## Features

- ✅ User Registration (Signup)
- ✅ User Login
- ✅ JWT-based Authentication
- ✅ Password Hashing with bcryptjs
- ✅ Protected Routes
- ✅ User Dashboard
- ✅ Modern UI with Tailwind CSS

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- bcryptjs for password hashing
- CORS enabled

### Frontend
- React 19
- Vite
- React Router DOM v6
- Axios for API calls
- Tailwind CSS for styling
- Context API for state management

## Project Structure

```
Study-Buddy-Finder-Pasidi-pasi/
├── backend/
│   ├── config/
│   │   └── db.js                    # Database configuration
│   ├── controllers/
│   │   └── auth.controller.js       # Authentication logic
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT verification middleware
│   ├── models/
│   │   └── User.js                  # User model schema
│   ├── routes/
│   │   └── auth.routes.js           # Authentication routes
│   ├── .env                         # Environment variables
│   ├── package.json
│   └── server.js                    # Main server file
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx            # Login page
    │   │   ├── Signup.jsx           # Signup page
    │   │   ├── Dashboard.jsx        # User dashboard
    │   │   └── PrivateRoute.jsx     # Protected route wrapper
    │   ├── context/
    │   │   └── AuthContext.jsx      # Authentication context
    │   ├── App.jsx                  # Main app component
    │   └── main.jsx
    ├── package.json
    └── tailwind.config.js

```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/studybuddyfinder
JWT_SECRET=study_buddy_finder_secret_key_2026_secure_token
```

4. Make sure MongoDB is running (if using local MongoDB):
```bash
mongod
```

5. Start the backend server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## API Endpoints

### Authentication Routes

#### 1. Register User
- **URL**: `POST /api/auth/signup`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "degree": "",
    "year": "",
    "subjects": [],
    "availableTime": {}
  }
}
```

#### 2. Login User
- **URL**: `POST /api/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: Same as signup

#### 3. Get Current User
- **URL**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

## User Model Schema

```javascript
{
  name: String,           // Required
  email: String,          // Required, unique
  password: String,       // Required, hashed
  degree: String,         // Optional
  year: String,           // Optional
  subjects: [String],     // Array of subjects
  availableTime: {
    weekdays: Boolean,
    weekend: Boolean,
    morning: Boolean,
    evening: Boolean
  },
  studyGroups: [ObjectId], // References to StudyGroup model
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Routes

- `/` - Redirects to login
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - User dashboard (Protected route)

## Testing the Application

1. **Start both servers** (backend on port 5000, frontend on port 5173)

2. **Test Signup Flow**:
   - Go to `http://localhost:5173`
   - Click "Sign up here"
   - Fill in the form:
     - Name: Test User
     - Email: test@example.com
     - Password: test123
     - Confirm Password: test123
   - Click "Sign up"
   - You should be redirected to the dashboard

3. **Test Login Flow**:
   - Logout from the dashboard
   - Go to login page
   - Enter your credentials
   - Click "Sign in"
   - You should be redirected to the dashboard

4. **Test Protected Routes**:
   - Try accessing `/dashboard` without logging in
   - You should be redirected to `/login`

## Features to Implement Next

Based on your requirements, the following features need to be implemented:

1. **Study Buddy Profile Management**
   - [ ] Edit profile page
   - [ ] Add/edit degree, year, subjects
   - [ ] Set available study times
   - [ ] View profile

2. **Find Study Buddies**
   - [ ] Search students by subject
   - [ ] Filter by availability
   - [ ] View other students' profiles

3. **Study Groups**
   - [ ] Create study group
   - [ ] Join study group
   - [ ] Leave study group
   - [ ] Delete group (creator only)
   - [ ] Study group list page

4. **Playwright Tests**
   - [ ] Test create profile
   - [ ] Test edit profile
   - [ ] Test search for study groups
   - [ ] Test joining/leaving groups

## Security Features

- ✅ Passwords are hashed using bcryptjs
- ✅ JWT tokens expire after 30 days
- ✅ Protected routes require authentication
- ✅ Email validation
- ✅ Password minimum length validation

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the MONGO_URI in .env file
- Try using MongoDB Atlas if local connection fails

### CORS Issues
- The backend has CORS enabled for all origins
- Make sure both servers are running

### Port Already in Use
- Change the PORT in backend .env file
- Vite will automatically use a different port if 5173 is busy

## Next Steps

Now that authentication is complete, you can proceed to build:
1. Profile editing functionality
2. Study buddy search feature
3. Study group management
4. Real-time features (optional)

## License

This project is for educational purposes.
