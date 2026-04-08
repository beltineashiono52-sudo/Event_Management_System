# University Event Management System

A full-stack web application designed for universities to manage events, venue bookings, budgets, attendee registrations, and approval workflows.

## 🌟 Features
- **Role-Based Access**: Specialized dashboards for Students, Staff, Organizers, Finance Officers, and Admins.
- **Event Registrations**: Students and staff can register for events directly from their dashboards.
- **Venue Management**: Real-time availability checks, conflict detection, and a dedicated admin interface for adding/editing venues.
- **Global Notifications**: Real-time built-in notification bell that alerts users about new approved events, venue changes, or registration updates.
- **Budget Approval**: Complete workflow for event organizers to request funds and for the finance office to approve/reject them.
- **User & Admin Controls**: System-wide statistics for admins, along with complete control over user roles, access, and passwords.

## 🛠 Tech Stack
- **Frontend**: React (Vite JS), React Router, React Bootstrap
- **Backend**: PHP (Native API framework)
- **Database**: MySQL

---

## 🚀 Quick Start Guide

Follow these steps to get the system running locally on your machine.

### 1. Database Setup
1. Open your MySQL interface (e.g., phpMyAdmin, MySQL Workbench, or command line).
2. Create a database named `university_events` (or let the schema file do it for you).
3. Import the initial database schema by running:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
4. Run the migration script to ensure the `event_registrations` table is set up:
   ```bash
   cd backend
   php migrate_registrations.php
   ```

### 2. Backend API Setup
1. Open `backend/config.php` and verify the database credentials (default is `root` with no password).
2. Start the local PHP development server **inside the backend directory**:
   ```bash
   cd backend
   php -S localhost:8000
   ```
   *Note: This must run on port 8000, as the frontend proxy expects the API here.*

### 3. Frontend Application Setup
1. Open a new terminal window.
2. Navigate to the `frontend` folder, install dependencies, and start the Vite dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. The frontend should automatically open at `http://localhost:3000`.

---

## 🔐 Default Test Accounts
Use these pre-configured accounts to explore the different dashboards. The password for all test accounts is `password`.

| Role | Username | Email |
|------|----------|-------|
| **Student** | `student` | `student@univ.edu` |
| **Organizer**| `organizer` | `organizer@univ.edu` |
| **Finance** | `finance` | `finance@univ.edu` |
| **Admin** | `admin` | `admin@univ.edu` |

*(Note: New Organizers, Finance officers, and Admins must be created from inside the Admin dashboard. The public registration page is strictly limited to Students and Staff).*
