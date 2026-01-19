# 🏨 Hostel Management System - Complete Setup Guide

A step-by-step guide to run this project on a new laptop.

---

## 📋 Prerequisites to Download & Install

### 1. Node.js (JavaScript Runtime)
- **Download**: https://nodejs.org
- **Version**: LTS (Long Term Support) - v20.x or v22.x
- **Verify Installation**:
  ```bash
  node --version
  npm --version
  ```

### 2. MongoDB (Database)
- **Download**: https://www.mongodb.com/try/download/community
- **Version**: Latest Community Edition
- **Installation**: Choose "Complete" setup
- **Important**: Check "Install MongoDB as a Service" during installation

---

## 🔧 Setup Commands (Run in Order)

### Step 1: Verify Node.js Installation
```bash
node --version
```
Expected output: `v20.x.x` or similar

```bash
npm --version
```
Expected output: `10.x.x` or similar

---

### Step 2: Verify MongoDB is Running
```bash
mongod --version
```
Or check Windows Services for "MongoDB Server"

---

### Step 3: Install live-server Globally
```bash
npm install -g live-server
```

---

### Step 4: Navigate to Backend Folder
```bash
cd "c:\Users\bhuva\OneDrive\Desktop\hostel-management-system - FINAL-ANTIGRAVITY\backend"
```

---

### Step 5: Install Backend Dependencies
```bash
npm install
```
This installs:
- express (web server)
- mongoose (database connection)
- bcryptjs (password encryption)
- jsonwebtoken (authentication)
- cors (cross-origin requests)
- multer (file uploads)
- node-cron (scheduled tasks)
- concurrently (run multiple processes)

---

### Step 6: Seed the Database (First Time Only)
```bash
npm run seed
```
This creates initial admin and student accounts.

---

### Step 7: Start the Application
```bash
npm run start
```
This starts:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:8080`

---

## 🔑 Default Login Credentials

### Admin Login
- **URL**: http://localhost:8080/admin-login.html
- **Username**: `admin`
- **Password**: `admin123`

### Student Login
- **URL**: http://localhost:8080/student-login.html
- **Roll Number**: `22CS001`
- **Password**: `password123`

---

## ❌ Troubleshooting

### MongoDB Connection Error
```
MongooseServerSelectionError: connect ECONNREFUSED
```
**Solution**: Start MongoDB service
```bash
net start MongoDB
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill the process using the port
```bash
npx kill-port 5000
```

### live-server Not Found
```
'live-server' is not recognized
```
**Solution**: Reinstall globally
```bash
npm install -g live-server
```

---

## 📁 Project Structure

```
hostel-management-system/
├── backend/
│   ├── server.js          # Main server file
│   ├── seed.js            # Database seeding
│   ├── package.json       # Dependencies
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── uploads/           # Uploaded files
│
└── frontend/
    ├── index.html         # Landing page
    ├── admin-login.html   # Admin login
    ├── student-login.html # Student login
    ├── css/               # Stylesheets
    └── js/                # JavaScript files
```

---

## ✅ Quick Reference Commands

| Action | Command |
|--------|---------|
| Install dependencies | `npm install` |
| Start project | `npm run start` |
| Start backend only | `npm run server` |
| Seed database | `npm run seed` |
| Check Node version | `node --version` |
| Check npm version | `npm --version` |

---

*Last updated: December 2024*
