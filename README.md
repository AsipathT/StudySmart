# 📚 StudySmart

<div align="center">

**An intelligent academic performance tracking and prediction platform built for SLIIT students.**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Sequelize-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Tested%20with-Playwright-45ba4b?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)

</div>

---

## 🎯 What is StudySmart?

StudySmart is a full-stack web application that helps SLIIT students track their academic performance, upload marks, visualise grade trends, predict exam outcomes, and get AI-powered study recommendations — all from one dashboard.

---

## ✨ Key Features

- 📤 **Upload Marks** — Excel/CSV upload with auto subject parsing
- 📊 **Analytics Dashboard** — GPA gauge, trend chart, grade distribution, subject cards
- ⚠️ **Early Warning System** — flags failing and at-risk subjects automatically
- 🔮 **Score Prediction** — ML-based predicted final score
- 🤖 **AI Study Assistant** — personalised study tips and recommendations
- 👤 **Student Profile** — academic info, study habits, avatar, semester GPA history
- 🔐 **Role-Based Access** — Student / Teacher / Admin roles

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Ant Design, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Sequelize ORM |
| Auth | JWT + bcrypt |
| Testing | Playwright (E2E) |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/your-username/StudySmart.git
cd StudySmart
```

### 2. Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_NAME=studysmart
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret
```

```bash
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Demo Login

| Role | Email | Password |
|---|---|---|
| Student | `ITxxxxxxxx@my.sliit.lk` | `PW` |
| Admin | `admin@studysmart.com` | `demo123` |

---

## 🧪 Running Tests

```bash
cd frontend
npx playwright install   # first time only
npx playwright test
npx playwright test --ui # with visual UI
```

---

## 👥 Team

**Group WE_238_3.2 · IT Project Management (IT 3040) · SLIIT · 3rd Year, 2nd Semester**

| Name | Contribution |
|---|---|
| Asipath T.M.N.V | Student Performance Predictor |
| Jithmini E.A.D.A | Session tracker |
| Kavindi T.A.C | Resource Library |
| Sarangi K.P.E | Study buddy finder |

---

<div align="center">

**Built with ❤️ by Team WE_288_1.1 · SLIIT Faculty of Computing**

</div>
