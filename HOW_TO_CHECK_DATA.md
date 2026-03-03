# How to Check All Data in Database

## 🎯 Quick Summary

Your database currently has:

- **5 Tenants** (institutions)
- **3 Cohorts** (batches)
- **14 Users** (1 executive, 1 facilitator, 1 faculty, 1 mentor, 10 students)
- **11 Sessions** (for attendance)
- **9 Attendance Records** (2 present, 7 absent)
- **60 Tracker Entries** (student daily logs)
- **1 Mentor Review** (rating: 5.0)
- **1 Team**
- **1 Project**

---

## 📊 Method 1: Using the Data Viewer Script (Recommended)

### Run the script:

```bash
cd Backend
npx ts-node scripts/view-all-data.ts
```

This will show you:

- ✅ All tenants with their details
- ✅ All cohorts with student counts
- ✅ All users organized by role
- ✅ Recent sessions and attendance
- ✅ Recent tracker entries
- ✅ All mentor reviews
- ✅ Teams and projects

### Output Format:

The data is displayed in neat tables showing:

- IDs, names, emails
- Dates and timestamps
- Relationships (which student belongs to which cohort)
- Counts (how many students, attendance records, etc.)

---

## 📋 Method 2: Using PostgreSQL Command Line

### Connect to database:

```bash
psql -U postgres -d yzone_db
```

### Check specific tables:

#### View all tenants:

```sql
SELECT id, name, institution_code, contact_email FROM tenants WHERE deleted_at IS NULL;
```

#### View all cohorts:

```sql
SELECT c.name, c.cohort_code, t.name as tenant, c.start_date, c.end_date
FROM cohorts c
LEFT JOIN tenants t ON c.tenant_id = t.id
WHERE c.deleted_at IS NULL;
```

#### View all users by role:

```sql
SELECT role, name, email, is_active
FROM users
WHERE deleted_at IS NULL
ORDER BY role, name;
```

#### View attendance records:

```sql
SELECT u.name as student, s.title as session, a.is_present, a.marked_at
FROM attendance a
JOIN users u ON a.student_id = u.id
JOIN sessions s ON a.session_id = s.id
ORDER BY a.marked_at DESC;
```

#### View tracker entries:

```sql
SELECT u.name as student, t.entry_date, t.hours_spent, t.tasks_completed
FROM tracker_entries t
JOIN users u ON t.student_id = u.id
ORDER BY t.entry_date DESC
LIMIT 10;
```

#### View mentor reviews:

```sql
SELECT m.name as mentor, s.name as student, mr.rating, mr.feedback, mr.review_date
FROM mentor_reviews mr
JOIN users m ON mr.mentor_id = m.id
JOIN users s ON mr.student_id = s.id
ORDER BY mr.review_date DESC;
```

---

## 🌐 Method 3: Using the Frontend Dashboard

### Executive Dashboard:

1. Login: `admin@yzone.com` / `admin123`
2. View:
   - All tenants
   - All cohorts
   - System statistics

### Facilitator Dashboard:

1. Login: `facilitator@yzone.com` / `facilitator123`
2. View:
   - Student performance
   - Attendance records
   - Tracker submissions

### Student Dashboard:

1. Login: `student@yzone.com` / `student123`
2. View:
   - Your tracker entries
   - Your attendance
   - Leaderboard position

### Mentor Dashboard:

1. Login: `mentor@yzone.com` / `mentor123`
2. View:
   - Assigned students
   - Reviews you've submitted

---

## 🔍 Method 4: Using Database GUI Tools

### Recommended Tools:

1. **pgAdmin** - Full-featured PostgreSQL GUI
2. **DBeaver** - Universal database tool
3. **TablePlus** - Modern database GUI

### Connection Details:

- Host: `localhost`
- Port: `5432`
- Database: `yzone_db`
- Username: `postgres`
- Password: (your postgres password)

---

## 📊 Current Data Summary

### Tenants:

1. Tech University (TECH001)
2. Test Tenant from Script (TEST001)
3. ijfvkejfv (;flvel,f)
4. API Test Tenant (API001)
5. Final Test Tenant (FINAL001)

### Cohorts:

1. Test Cohort 2025 (TC2025) - 9 students
2. BatchA (B2ioiB) - 1 student
3. Batch Bk (jncdjn3) - 0 students

### Users by Role:

- **Executive**: 1 (Admin Executive)
- **Facilitator**: 1 (John Facilitator)
- **Faculty**: 1 (Dr. Sarah Principal)
- **Mentor**: 1 (Mike Mentor)
- **Students**: 10 (Alice, Bob, Carol, David, Eva, Frank, Grace, Henry, Alice Student, MADHAN KUMAR M)

### Recent Activity:

- **Latest Session**: Code Review Session (2026-03-04)
- **Latest Attendance**: Soft Skills Training - 9 records
- **Latest Tracker**: Henry Taylor (2026-02-27)
- **Latest Review**: Mike Mentor → Alice Johnson (5.0 rating)

---

## ✅ Verification Checklist

To verify data is being entered correctly:

### After Creating a Tenant:

```bash
npx ts-node scripts/view-all-data.ts
```

Check the "TENANTS" section - your new tenant should appear

### After Creating a Cohort:

Check the "COHORTS" section - should show:

- Cohort name and code
- Associated tenant
- Student count

### After Marking Attendance:

Check the "ATTENDANCE" section - should show:

- Student name
- Session title
- Present/Absent status
- Timestamp

### After Submitting Tracker:

Check the "TRACKER ENTRIES" section - should show:

- Student name
- Date
- Hours spent
- Tasks completed

### After Submitting Review:

Check the "MENTOR REVIEWS" section - should show:

- Mentor name
- Student name
- Rating
- Feedback

---

## 🚀 Quick Commands

### View all data:

```bash
cd Backend
npx ts-node scripts/view-all-data.ts
```

### Check specific table counts:

```bash
cd Backend
npx ts-node -e "
const { pool } = require('./src/config/db');
pool.query('SELECT COUNT(*) FROM users').then(r => {
  console.log('Users:', r.rows[0].count);
  pool.end();
});
"
```

### Export data to CSV (using psql):

```bash
psql -U postgres -d yzone_db -c "\copy users TO 'users.csv' CSV HEADER"
```

---

## 📝 Notes

- All data is stored in PostgreSQL database `yzone_db`
- Soft deletes are used (deleted_at column) - deleted records are not shown
- Multi-tenant architecture - all data is filtered by tenant_id
- Timestamps are in UTC
- The view-all-data script shows the most recent 10 records for large tables

---

## 🎉 Conclusion

You now have multiple ways to check your data:

1. ✅ Run the data viewer script (easiest)
2. ✅ Use SQL queries (most flexible)
3. ✅ Check dashboards (user-friendly)
4. ✅ Use database GUI tools (visual)

All your data is being stored correctly in the database!
