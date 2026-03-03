# YZONE SYSTEM - COMPLETE SETUP GUIDE

## System Overview

Enterprise multi-tenant learning management system with role-based access control, tracker management, leaderboard, WhatsApp notifications, and Azure Blob Storage integration.

## Roles

- tynExecutive: System administrator, manages tenants, cohorts, and all users
- facilitator: Manages cohort students, tracks attendance and submissions
- facultyPrincipal: Academic oversight, views overall performance
- industryMentor: Mentors assigned students, provides feedback
- student: Submits daily trackers, views progress and leaderboard

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Azure Storage Account (for file uploads)
- WhatsApp Business API credentials

## Installation Steps

### 1. Database Setup

```bash
# Create database
createdb yzonedb

# Run schema
psql -U postgres -d yzonedb -f database/schema.sql
```

### 2. Environment Configuration

Update `.env` file with your credentials:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=yzonedb
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
AZURE_STORAGE_CONTAINER=yzone-files

WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token

CRON_TRACKER_REMINDER=0 22 * * *
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Application

```bash
npm run dev
```

## API Endpoints

### Authentication

- POST /api/auth/login - User login
- POST /api/auth/register - User registration

### Tyn Executive

- POST /api/executive/tenant - Create tenant
- GET /api/executive/tenant - Get all tenants
- GET /api/executive/tenant/:id - Get tenant by ID
- PUT /api/executive/tenant/:id - Update tenant
- DELETE /api/executive/tenant/:id - Delete tenant
- GET /api/executive/tenant/stats - Get tenant statistics
- POST /api/executive/cohort - Create cohort
- GET /api/executive/cohort - Get all cohorts
- POST /api/executive/cohort/assign-facilitator - Assign facilitator to cohort
- GET /api/executive/dashboard - Executive dashboard
- POST /api/executive/mentor/create - Create industry mentor
- POST /api/executive/mentor/assign - Assign students to mentor

### Facilitator

- GET /api/facilitator/dashboard - Facilitator dashboard
- GET /api/facilitator/students - Get assigned students
- POST /api/facilitator/attendance - Mark attendance
- GET /api/facilitator/tracker-status - View tracker submission status

### Faculty/Principal

- GET /api/faculty/dashboard - Faculty dashboard
- GET /api/faculty/attendance-summary - Attendance overview
- GET /api/faculty/student-progress - Student progress stats

### Industry Mentor

- GET /api/mentor/dashboard - Mentor dashboard
- GET /api/mentor/students - Get assigned students
- POST /api/mentor/review - Submit student review
- GET /api/mentor/reviews/:studentId - Get student reviews

### Student

- GET /api/student/dashboard - Student dashboard
- POST /api/student/tracker - Submit daily tracker
- GET /api/student/tracker - Get tracker history
- GET /api/student/leaderboard - View leaderboard
- GET /api/student/notifications - Get notifications
- PUT /api/student/notifications/:id/read - Mark notification as read

## Automated Jobs

### Tracker Reminder (10 PM Daily)

- Finds students who haven't submitted tracker
- Sends WhatsApp reminders
- Alerts facilitators (3 days missed)
- Alerts mentors (5 days missed)

### Leaderboard Calculation (Midnight Daily)

- Calculates scores based on:
  - Tracker consistency (25%)
  - Performance/hours (25%)
  - Attendance (25%)
  - Mentor ratings (25%)
- Updates ranks per cohort

## Multi-Tenant Architecture

- All queries filtered by tenant_id from JWT
- Each institution is isolated
- Cohorts belong to tenants
- Users belong to tenants and cohorts

## Security Features

- JWT authentication
- Role-based access control
- Password hashing (bcrypt)
- Tenant isolation
- Soft deletes

## File Upload

- Azure Blob Storage integration
- Tracker proof files
- Secure URL generation
- Metadata tracking in database

## Default Login

After running schema:

- Email: admin@yzone.com
- Password: admin123
- Role: tynExecutive

## Testing

1. Login as tynExecutive
2. Create a tenant
3. Create a cohort
4. Create users (facilitator, mentor, students)
5. Assign facilitator to cohort
6. Assign students to mentor
7. Login as student and submit tracker
8. View dashboards for each role

## Production Deployment

1. Set strong JWT_SECRET
2. Configure Azure Storage
3. Set up WhatsApp Business API
4. Enable SSL/TLS
5. Set up database backups
6. Configure environment variables
7. Use process manager (PM2)
8. Set up monitoring and logging

## Support

For issues or questions, contact the development team.
