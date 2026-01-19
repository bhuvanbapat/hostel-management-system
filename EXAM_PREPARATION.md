# WEB TECHNOLOGY MINI-PROJECT EXAM PREPARATION
**Course Code:** 24ISE136  
**Academic Year:** 2025-2026

---

## 1. PROJECT TITLE

**HOSTEL MANAGEMENT SYSTEM**

**Team Members:**
- BHUVAN BAPAT (1BG24IS017)
- MANOJ KUMAR H R (1BG24IS034)

**Guide:** Mrs. Kavya N L, Assistant Professor, Dept. of ISE

**Institution:** B.N.M. Institute of Technology, Bengaluru

---

## 2. HARDWARE/SOFTWARE REQUIREMENTS

### 2.1 Hardware Requirements
- **Processor:** Intel Core i3 or higher
- **RAM:** Minimum 4 GB (8 GB recommended)
- **Hard Disk:** Minimum 10 GB free space
- **Network:** Active internet connection for cloud database access
- **Display:** Standard monitor with minimum 1024x768 resolution

### 2.2 Software Requirements

**Development Environment:**
- **Operating System:** Windows 10/11, macOS, or Linux
- **Code Editor:** Visual Studio Code
- **Version Control:** Git

**Backend Technologies:**
- **Runtime:** Node.js (v16 or higher)
- **Framework:** Express.js (v5.1.0)
- **Database:** MongoDB Atlas (Cloud NoSQL Database)
- **ODM:** Mongoose (v8.18.3)
- **Authentication:** JSON Web Token (JWT v9.0.2)
- **Security:** bcryptjs (v3.0.2) for password hashing
- **File Upload:** Multer (v2.0.2)
- **Task Scheduling:** node-cron (v4.2.1)
- **CORS Management:** cors (v2.8.5)
- **Process Management:** concurrently (v9.2.1)

**Frontend Technologies:**
- **Markup:** HTML5
- **Styling:** CSS3
- **Scripting:** JavaScript (ES6+)
- **Development Server:** live-server

**Browser Compatibility:**
- Google Chrome (latest)
- Microsoft Edge (latest)
- Mozilla Firefox (latest)

---

## 3. METHODOLOGY

### 3.1 Development Approach
The Hostel Management System follows a **Three-Tier Architecture** model comprising the Presentation Layer, Application Layer, and Data Layer. This ensures clear separation of concerns, modularity, and scalability.

### 3.2 Techniques Used

**1. Role-Based Access Control (RBAC)**
- Differentiates privileges between administrators and students
- Prevents unauthorized data manipulation
- Ensures secure operations

**2. Modular Design Principles**
- Separates concerns across authentication, routing, and database operations
- Facilitates maintainability and reduces complexity
- Enables independent module testing

**3. RESTful API Architecture**
- Standardized communication between frontend and backend
- Clear endpoint definitions for each operation
- Consistent data exchange format (JSON)

**4. Authentication & Security Techniques**
- Password hashing using bcryptjs
- Token-based verification using JWT
- Session management for secure access control

**5. Data Modeling & Validation**
- Mongoose schemas for structured data
- Input validation to maintain data integrity
- Consistent database operations

**6. Client-Side Dynamic Rendering**
- Real-time updates without page reloads
- Improved user experience
- Efficient data presentation

### 3.3 Development Workflow

**Phase 1: Planning & Analysis**
- Identified hostel management challenges
- Defined functional and non-functional requirements
- Designed system architecture

**Phase 2: Design**
- Created system block diagrams
- Designed database schemas
- Planned user interfaces for admin and student roles

**Phase 3: Implementation**
- Developed backend APIs using Express.js
- Created frontend interfaces with HTML/CSS/JavaScript
- Integrated MongoDB database
- Implemented authentication and authorization

**Phase 4: Testing**
- Unit testing of individual modules
- Integration testing of components
- System testing for complete workflows
- Security and performance testing

**Phase 5: Deployment**
- Configured cloud database (MongoDB Atlas)
- Set up concurrent server execution
- Verified cross-browser compatibility

---

## 4. BLOCK DIAGRAM

### 4.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (Tier 1)              │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │   Admin Dashboard        │  │  Student Dashboard      │ │
│  │  (HTML/CSS/JavaScript)   │  │ (HTML/CSS/JavaScript)   │ │
│  └──────────┬───────────────┘  └───────────┬─────────────┘ │
└─────────────┼──────────────────────────────┼───────────────┘
              │                              │
              │    HTTP Requests/Responses   │
              │                              │
┌─────────────┼──────────────────────────────┼───────────────┐
│             ▼                              ▼               │
│                  APPLICATION LAYER (Tier 2)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Node.js & Express.js Server                  │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  Auth      │  │   API        │  │ Controllers  │ │  │
│  │  │ Middleware │  │  Routes      │  │              │ │  │
│  │  └────────────┘  └──────────────┘  └──────────────┘ │  │
│  │         │               │                  │         │  │
│  │         └───────────────┴──────────────────┘         │  │
│  │                      JWT Verification                │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          │ Database Queries
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                    DATA LAYER (Tier 3)                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           MongoDB Atlas (Cloud Database)             │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐  │ │
│  │  │ Users  │ │Students│ │  Fees  │ │ Mess Menu &  │  │ │
│  │  │        │ │        │ │        │ │ Notifications│  │ │
│  │  └────────┘ └────────┘ └────────┘ └──────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### 4.2 Login Process Flow Diagram

```
         START
           │
           ▼
    ┌─────────────┐
    │ User Opens  │
    │ Login Page  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────┐
    │ Enter Username  │
    │  and Password   │
    └──────┬──────────┘
           │
           ▼
    ┌──────────────────┐
    │ Submit Credentials│
    │  (POST Request)  │
    └──────┬───────────┘
           │
           ▼
    ┌────────────────────┐
    │ Server Validates   │
    │   Credentials      │
    └──────┬─────────────┘
           │
           ▼
    ┌──────────────────┐
    │  Credentials     │
    │    Valid?        │
    └──┬────────────┬──┘
       │ NO         │ YES
       │            │
       ▼            ▼
┌─────────────┐  ┌──────────────┐
│Display Error│  │  Check User  │
│  Message    │  │     Role     │
└──────┬──────┘  └──────┬───────┘
       │                │
       │                ▼
       │         ┌──────────────┐
       │         │ Generate JWT │
       │         │    Token     │
       │         └──────┬───────┘
       │                │
       │                ▼
       │         ┌──────────────┐
       │         │Store Token & │
       │         │Grant Access  │
       │         └──────┬───────┘
       │                │
       │                ▼
       │         ┌──────────────────┐
       │    ┌────┤  Redirect User   │
       │    │    └──────────────────┘
       │    │
       │    ▼            ▼
       │  ┌─────────┐  ┌──────────┐
       │  │  Admin  │  │ Student  │
       │  │Dashboard│  │Dashboard │
       │  └─────────┘  └──────────┘
       │       │            │
       └───────┴────────────┘
                  │
                  ▼
                END
```

---

## 5. MODULES IMPLEMENTED

### Module 1: User Authentication & Authorization
**Purpose:** Controls secure access to the system based on user roles

**Features:**
- Secure login with credential validation
- Password encryption using bcryptjs
- JWT token generation for session management
- Role identification (Admin/Student)
- Unauthorized access prevention

**Technology:** Node.js, Express.js, JWT, bcryptjs

---

### Module 2: Admin Management Module
**Purpose:** Centralized administrative control panel

**Features:**
- Complete system oversight
- Student information management
- Fee record control
- Mess menu configuration
- Notification publishing
- Dashboard with management tools

**Access:** Restricted to administrators only

---

### Module 3: Student Information Management
**Purpose:** Maintains comprehensive student records

**Admin Capabilities:**
- Add new student records
- Update existing information
- Delete outdated entries
- View student profiles
- Manage academic and hostel details

**Student Capabilities:**
- View personal profile
- Access hostel details

**Data Stored:** Name, USN, Room Number, Contact Info, Academic Details

---

### Module 4: Fee Management Module
**Purpose:** Handles all hostel fee-related operations

**Admin Features:**
- Define fee structures
- Update payment details
- Monitor outstanding dues
- Track payment history
- Generate fee reports

**Student Features:**
- View total fees
- Check payment status
- View pending balance
- Access payment history

**Benefits:** Transparency, reduced manual inquiries, accurate tracking

---

### Module 5: Mess Menu Management
**Purpose:** Organizes and communicates daily/weekly meal schedules

**Admin Features:**
- Update daily menu (Breakfast, Lunch, Snacks, Dinner)
- Set weekly schedules
- Modify based on availability
- Special occasion menu updates

**Student Features:**
- View current day menu
- Check weekly schedule
- Plan meals accordingly

**Benefits:** Reduces confusion, improves coordination

---

### Module 6: Notification & Announcement Module
**Purpose:** Structured platform for hostel communication

**Notification Types:**
- Fee deadline reminders
- Mess menu changes
- Hostel rules updates
- Maintenance schedules
- General announcements

**Admin Features:**
- Create notifications
- Manage announcements
- Targeted message delivery

**Student Features:**
- View all notifications
- Real-time updates
- Notification history

---

### Module 7: Dashboard & Navigation Module
**Purpose:** Primary user interface and navigation control

**Admin Dashboard:**
- Management tools access
- Quick summary views
- Student overview
- Fee statistics
- System controls

**Student Dashboard:**
- Personal information
- Fee summary
- Mess menu access
- Notifications panel
- Profile management

**Features:** Role-based display, clear navigation, intuitive layout

---

### Module 8: Backend API Management
**Purpose:** Handles frontend-backend communication

**API Endpoints:**
- `/auth/login` - User authentication
- `/students/*` - Student operations
- `/fees/*` - Fee management
- `/mess-menu/*` - Menu operations
- `/notifications/*` - Announcement handling

**Features:**
- RESTful architecture
- Request validation
- Structured responses
- Error handling
- Consistent data exchange

---

### Module 9: Database Storage & Management
**Purpose:** Persistent data storage and retrieval

**Database:** MongoDB Atlas (Cloud NoSQL)

**Collections:**
- Users (Admin/Student credentials)
- Students (Profile information)
- Fees (Payment records)
- Mess Menu (Daily schedules)
- Notifications (Announcements)

**Operations:** Create, Read, Update, Delete (CRUD)

**Features:** Data validation, structured schemas, efficient queries

---

### Module 10: Security & Protection Module
**Purpose:** Safeguards system resources and sensitive data

**Security Measures:**
- Password hashing (bcryptjs)
- JWT token verification
- Session validation
- Role-based access control
- Input sanitization
- Protection against common web vulnerabilities

**Benefits:** Data confidentiality, integrity, trustworthiness

---

### Module 11: UI Rendering & Client-Side Logic
**Purpose:** Dynamic interface updates and user interaction handling

**Features:**
- Real-time data updates
- Form validation
- Dynamic content rendering
- Smooth user interactions
- Responsive feedback
- No-reload updates

**Technology:** JavaScript (ES6+), DOM manipulation

---

### Module 12: Frontend Navigation & Routing
**Purpose:** Controls page transitions and route management

**Features:**
- Role-specific navigation menus
- Clear route definitions
- Smooth page transitions
- Unauthorized route blocking
- Consistent navigation flow

**Pages:**
- Login pages (Admin/Student)
- Dashboards
- Fee management pages
- Mess menu pages
- Notification panels

---

### Module 13: Error Handling & Feedback Module
**Purpose:** Manages errors and provides user feedback

**Error Types Handled:**
- Invalid inputs
- Failed operations
- Unauthorized access
- Network errors
- Database errors

**Features:**
- User-friendly error messages
- Validation feedback
- Clear corrective guidance
- System stability maintenance

---

## KEY POINTS FOR DEMO

### Demo Flow:
1. **Show Login** - Admin and Student login
2. **Admin Operations** - Add student, update fees, set menu
3. **Student View** - Dashboard, fees, menu, notifications
4. **Security** - Show role-based access restrictions

### Important Concepts to Explain:
- **Three-Tier Architecture**
- **JWT Authentication**
- **Role-Based Access Control**
- **RESTful API Structure**
- **Cloud Database (MongoDB Atlas)**

### Project Highlights:
- Digitizes manual hostel management
- Centralized data management
- Real-time updates
- Secure and scalable
- User-friendly interface
- Reduces administrative workload

---

**Remember:** Both teammates must present the same project title: **"HOSTEL MANAGEMENT SYSTEM"**
