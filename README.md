# University Event Management System

A full-stack web application for managing university events, venue bookings, budgets, and approval workflows.

## Features
- **Role-Based Access**: Specialized dashboards for Students, Organizers, Finance, and Admins.
- **Venue Booking**: Real-time availability checks and conflict detection.
- **Budget Approval**: Workflow for organizers to request funds and finance to approve/reject.
- **Analytics**: Admin dashboard with system-wide event and budget statistics.

## Tech Stack
- **Frontend**: React (Vite), Bootstrap
- **Backend**: PHP (Native)
- **Database**: MySQL

## Quick Start
### 1. Database
Import `database/schema.sql` into a MySQL database named `university_events`.

### 2. Backend
- Configure `backend/config.php` with your DB credentials.
- Host the `backend` folder via a PHP server (e.g., XAMPP, Apache).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Users (Password: `password`)
- **Student**: `student`
- **Organizer**: `organizer`
- **Finance**: `finance`
- **Admin**: `admin`
