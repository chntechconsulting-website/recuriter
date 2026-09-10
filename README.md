# Recruiter & Candidate Lead Management System

A production-ready **Recruiter & Candidate Lead Management System** built with **React** and powered directly by **Neon Serverless PostgreSQL**.

---

## 🏗️ System Architecture

### Frontend & Database Layer
- **Framework**: React 19 with Vite
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js & React-Chartjs-2
- **Data Import / Export**: Pure JavaScript `xlsx` client engine
- **Routing**: React Router v7 with Role-Based Route Guards

---

## 📋 Core Modules

1. **Dashboard**: Live analytics and metrics for College/Vendor recruiter pipelines and candidate registrations.
2. **Colleges & Vendors Management**: Manage 3,600+ recruiter leads starting from ID #1 (`REC-000001` upwards).
3. **Candidates Management**: Manage candidate registrations starting from ID #1 (`CAN-000001` upwards).
4. **Follow-ups & Scheduling**: Track upcoming, overdue, and completed follow-up calls.
5. **Communication History**: Log phone, WhatsApp, email, and meeting interactions.
6. **Excel Import & Export**: Fast client-side import and export for large datasets.
7. **Role-based Authentication**: Admin and Staff accounts with session management.
8. **Reports & Audit Trail**: Status transition logs, activity logs, and system settings.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher) & **npm**

---

### 2. Setup & Installation

1. Navigate to the `frontend/` directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Run database migration script to seed/reset Neon DB:
```bash
node scripts/setup_neon.mjs
```

4. Start the Vite development server:
```bash
npm run dev
```
- The application will be live at: `http://localhost:5173`

---

## 🔑 Default Login Credentials

| Role | Email / Username | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@jobfair.com` | `Admin@123Password` | Full access (Leads, Candidates, Reports, Users, System Settings) |
| **Admin (Secondary)** | `priya.sharma@jobfair.com` | `Staff@123Password` | Full access |
| **Staff Member** | `rahul.verma@jobfair.com` | `Staff@123Password` | Lead & Candidate CRUD, Follow-ups, Communications, Status updates |
| **Staff Member** | `ananya.rao@jobfair.com` | `Staff@123Password` | Lead & Candidate CRUD, Follow-ups, Communications, Status updates |

---

## ☁️ Neon Database Connection

- **Provider**: Neon Serverless PostgreSQL
- **Connection String**: Configured in `frontend/src/db/database.js`
