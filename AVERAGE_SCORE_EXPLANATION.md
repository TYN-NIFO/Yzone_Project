# 📊 Average Score Explanation - All Dashboards

## Overview

The **Average Score** shown in different dashboards comes from the **Leaderboard** system, which automatically calculates and updates student scores based on multiple performance metrics.

---

## 🎯 What is the Average Score?

The average score is the **mean of all students' total scores** from the leaderboard table. Each student has a `total_score` that ranges from **0 to 100 points**, calculated from 4 components:

### Score Components (Total: 100 points)

1. **Tracker Consistency Score** (25 points max)
   - Based on daily tracker submissions in the last 30 days
   - Formula: `(submissions_count / 30) × 25`
   - Example: 20 submissions in 30 days = (20/30) × 25 = 16.67 points

2. **Performance Score** (25 points max)
   - Based on average hours spent per day in last 30 days
   - Formula: `(avg_hours / 8) × 25`
   - Example: Average 6 hours/day = (6/8) × 25 = 18.75 points

3. **Attendance Score** (25 points max)
   - Based on session attendance percentage
   - Formula: `(present_sessions / total_sessions) × 25`
   - Example: 18 present out of 20 sessions = (18/20) × 25 = 22.5 points

4. **Mentor Rating Score** (25 points max)
   - Based on average mentor review ratings
   - Formula: `(avg_rating / 5) × 25`
   - Example: Average rating 4.2/5 = (4.2/5) × 25 = 21 points

**Total Score Example:** 16.67 + 18.75 + 22.5 + 21 = **78.92 points**

---

## 📍 Average Score in Each Dashboard

### 1. Facilitator Dashboard

**Location:** Stats card at the top

**What it shows:** Average score of all students in the facilitator's assigned cohorts

**SQL Query:**

```sql
SELECT AVG(l.total_score) as avg_score
FROM users u
LEFT JOIN leaderboard l ON u.id = l.student_id
WHERE u.cohort_id = ANY($cohortIds)
  AND u.role = 'student'
  AND u.deleted_at IS NULL
```

**Who sees it:** Facilitators

**Scope:** Only students in cohorts assigned to that facilitator

**Example:** If a facilitator has 2 cohorts with 10 students each:

- Cohort A average: 75.5
- Cohort B average: 82.3
- **Dashboard shows:** 78.9 (average of all 20 students)

---

### 2. Faculty Dashboard

**Location:** Stats card at the top

**What it shows:** Average score of ALL students in the entire institution (tenant)

**SQL Query:**

```sql
SELECT AVG(l.total_score) as avg_score
FROM users u
LEFT JOIN leaderboard l ON u.id = l.student_id
WHERE u.tenant_id = $tenantId
  AND u.deleted_at IS NULL
```

**Who sees it:** Faculty/Principal

**Scope:** All students across all cohorts in the institution

**Example:** If institution has 100 students across 5 cohorts:

- Total of all scores: 7,850
- **Dashboard shows:** 78.5 (7850 / 100)

---

### 3. Industry Mentor Dashboard

**Location:** Stats card at the top

**What it shows:** Average score of students assigned to that specific mentor

**Calculation (in code):**

```typescript
const studentsWithScores = students.filter((s) => s.score !== null);
const avgScore =
  studentsWithScores.length > 0
    ? studentsWithScores.reduce((sum, s) => sum + parseFloat(s.score), 0) /
      studentsWithScores.length
    : 0;
```

**Who sees it:** Industry Mentors

**Scope:** Only students assigned to that mentor through mentor_assignments table

**Example:** If mentor has 5 assigned students:

- Student scores: 85, 78, 92, 65, 80
- **Dashboard shows:** 80.0 ((85+78+92+65+80) / 5)

---

## 🔄 Who Updates the Scores?

### Automatic Updates (System)

The leaderboard scores are **automatically calculated and updated** by a **cron job** that runs:

**Schedule:** Daily at midnight (00:00)

**Cron Expression:** `0 0 * * *`

**Process:**

1. Cron job triggers at midnight
2. Fetches all active cohorts
3. For each cohort:
   - Gets all students
   - Calculates 4 score components for each student
   - Updates or inserts into `leaderboard` table
   - Recalculates ranks based on total scores

**Code Location:** `Backend/src/cron/tracker-reminder.cron.ts`

```typescript
export function startLeaderboardCalculationCron() {
  cron.schedule("0 0 * * *", async () => {
    const cohorts = await pool.query(`
      SELECT id, tenant_id FROM cohorts 
      WHERE is_active = true AND deleted_at IS NULL
    `);

    for (const cohort of cohorts.rows) {
      await leaderboardService.calculateLeaderboard(
        cohort.id,
        cohort.tenant_id,
      );
    }
  });
}
```

---

## 📊 Data Sources for Score Calculation

### 1. Tracker Consistency Score

**Source:** `tracker_entries` table
**Updated by:** Students (when they submit daily trackers)
**Frequency:** Daily submissions
**Impact:** More consistent submissions = higher score

### 2. Performance Score

**Source:** `tracker_entries.hours_spent` field
**Updated by:** Students (when they submit trackers with hours)
**Frequency:** Daily submissions
**Impact:** More hours spent learning = higher score

### 3. Attendance Score

**Source:** `attendance` table
**Updated by:** Facilitators (when they mark attendance for sessions)
**Frequency:** Per session (varies by cohort schedule)
**Impact:** Better attendance = higher score

### 4. Mentor Rating Score

**Source:** `mentor_reviews` table
**Updated by:** Industry Mentors (when they submit reviews)
**Frequency:** Periodic (as mentors provide feedback)
**Impact:** Higher mentor ratings = higher score

---

## 🔍 How to Check Current Scores

### Via Database Query:

```sql
-- Check a specific student's score breakdown
SELECT
  u.name,
  l.total_score,
  l.tracker_consistency_score,
  l.performance_score,
  l.attendance_score,
  l.mentor_rating_score,
  l.rank,
  l.calculated_at
FROM leaderboard l
JOIN users u ON l.student_id = u.id
WHERE u.email = 'student1@yzone.com';
```

### Via API:

```bash
# Get student's leaderboard rank
GET /api/student/dashboard
Authorization: Bearer <student_token>

# Response includes:
{
  "leaderboardRank": {
    "rank": 5,
    "total_score": 327.68,
    "tracker_consistency_score": 20.5,
    "performance_score": 22.3,
    "attendance_score": 23.8,
    "mentor_rating_score": 21.0
  }
}
```

---

## ⚙️ Manual Score Recalculation

If you need to manually trigger score calculation (without waiting for midnight):

### Option 1: Run Script

```bash
cd Backend
npx ts-node -e "
import { LeaderboardService } from './src/services/leaderboard.service';
import { pool } from './src/config/db';

(async () => {
  const leaderboardService = new LeaderboardService();
  const cohorts = await pool.query('SELECT id, tenant_id FROM cohorts WHERE is_active = true');

  for (const cohort of cohorts.rows) {
    await leaderboardService.calculateLeaderboard(cohort.id, cohort.tenant_id);
    console.log('Calculated leaderboard for cohort:', cohort.id);
  }

  process.exit(0);
})();
"
```

### Option 2: Create API Endpoint (for admins)

Add to facilitator or executive routes:

```typescript
router.post(
  "/recalculate-leaderboard",
  roleMiddleware(["facilitator", "tynExecutive"]),
  async (req: AuthRequest, res: Response) => {
    const { cohortId } = req.body;
    const tenantId = req.user!.tenantId;

    await leaderboardService.calculateLeaderboard(cohortId, tenantId);

    res.json({ success: true, message: "Leaderboard recalculated" });
  },
);
```

---

## 📈 Score Interpretation

### Score Ranges:

- **90-100:** Excellent - Highly engaged, consistent, and performing well
- **75-89:** Good - Regular participation with good performance
- **60-74:** Average - Moderate engagement, room for improvement
- **45-59:** Below Average - Inconsistent participation
- **0-44:** Poor - Needs immediate attention and support

### What Affects Average Score:

**Increases Average Score:**

- ✅ Students submitting trackers daily
- ✅ Students spending more hours learning
- ✅ Better attendance in sessions
- ✅ Positive mentor reviews

**Decreases Average Score:**

- ❌ Missing tracker submissions
- ❌ Low hours spent on learning
- ❌ Poor attendance
- ❌ Low mentor ratings

---

## 🎯 Key Differences Between Dashboards

| Dashboard       | Scope                  | Average Of                        | Updated By    |
| --------------- | ---------------------- | --------------------------------- | ------------- |
| **Facilitator** | Assigned cohorts only  | Students in facilitator's cohorts | System (cron) |
| **Faculty**     | Entire institution     | All students in tenant            | System (cron) |
| **Mentor**      | Assigned students only | Students assigned to mentor       | System (cron) |

---

## 💡 Important Notes

1. **Scores update once daily** at midnight - not in real-time
2. **New students** start with 0 score until first calculation
3. **Inactive students** (deleted_at IS NOT NULL) are excluded
4. **Students without scores** show as "N/A" in dashboards
5. **Average calculation** excludes students with NULL scores
6. **Ranks** are recalculated after scores update (1 = highest score)

---

## 🔧 Troubleshooting

### "Average Score shows N/A"

**Cause:** No students have scores yet
**Solution:** Wait for midnight cron job or manually trigger calculation

### "Score hasn't updated"

**Cause:** Cron job hasn't run yet
**Solution:** Check if cron is running, or manually trigger

### "Score seems wrong"

**Cause:** Missing data in one of the 4 components
**Solution:** Check tracker_entries, attendance, and mentor_reviews tables

---

## 📝 Summary

- **Average Score** = Mean of all students' total scores (0-100)
- **Total Score** = Sum of 4 components (each worth 25 points)
- **Updated by** = Automated cron job (daily at midnight)
- **Calculated from** = Tracker submissions, hours spent, attendance, mentor ratings
- **Different dashboards** show different scopes (cohort, institution, or assigned students)

---

**Last Updated:** March 7, 2026
**Cron Schedule:** Daily at 00:00 (midnight)
**Score Range:** 0-100 points
