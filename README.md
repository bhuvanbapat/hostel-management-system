# 🏨 Hostel Management System

A full-stack web application for managing hostel operations including student management, room allocation, fee tracking, leave applications, complaints, and more.

## 🚀 Features

- **Admin Dashboard** - Manage students, rooms, fees, and announcements
- **Student Portal** - Apply for leave, submit complaints, view mess menu
- **Room Management** - Room allocation and change requests
- **Fee Management** - Track and manage student fees
- **Attendance Tracking** - Monitor student attendance
- **Announcements** - Broadcast messages to students
- **Mess Menu** - Weekly menu management

## 📋 Prerequisites

Before running this project, make sure you have installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Atlas or local installation)
- [Git](https://git-scm.com/)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hostel-management-system.git
cd hostel-management-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
MONGODB_URI=your_mongodb_connection_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
PORT=3000
```

### 4. Start the Backend Server

```bash
npm start
```

The server will run at `http://localhost:3000`

### 5. Open the Frontend

Open `frontend/index.html` in your browser, or use a local server:

```bash
cd ../frontend
npx serve .
```

## 📁 Project Structure

```
hostel-management-system/
├── backend/
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Main server file
│   ├── package.json
│   └── .env.example     # Environment template
├── frontend/
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript files
│   ├── index.html       # Landing page
│   ├── admin.html       # Admin dashboard
│   └── student.html     # Student dashboard
└── README.md
```

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

> ⚠️ **Important:** Change the default password after first login!

## 🛡️ Security Notes

- Never commit the `.env` file to version control
- Use strong passwords in production
- Consider using JWT token expiration
- Enable HTTPS in production

## 📄 License

This project is for educational purposes.

## 👤 Author

Made with ❤️ for Hostel Management
