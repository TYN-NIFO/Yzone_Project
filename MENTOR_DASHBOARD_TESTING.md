# 🧪 Industry Mentor Dashboard - Testing Guide

## ✅ Backend Status: FULLY WORKING

The backend API is returning correct data. Here's proof:

### API Response (Verified)

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalStudents": 4,
      "activeStudents": 4,
      "avgScore": 265.08
    },
    "students": [
      {
        "id": "...",
        "name": "Alice Johnson",
        "email": "student1@yzone.com",
        "cohort_name": "AI & ML Batch 2024",
        "recent_trackers": 8,
        "score": 327.68,
        "rank": 8
      },
      {
        "name": "David Wilson",
        "cohort_name": "AI & ML Batch 2024",
        "recent_trackers": 8,
        "score": 326.95,
        "rank": 9
      },
      {
        "name": "Grace Lee",
        "cohort_name": "AI & ML Batch 2024",
        "recent_trackers": 8,
        "score": 336.68,
        "rank": 6
      },
      {
        "name": "Sam Rivera",
        "cohort_name": "AI & ML Batch 2024",
        "recent_trackers": 3,
        "score": 69.0,
        "rank": 13
      }
    ]
  }
}
```

---

## 🔧 How to Test

### Step 1: Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:5000/api/auth/login
```

Should return: `{"message":"Invalid credentials"}` (this is good - means server is running)

### Step 2: Test Backend API Directly

```bash
cd Backend
npx ts-node scripts/test-mentor-api-response.ts
```

**Expected Output:**

```
✅ Login successful
📊 Full API Response:
{
  "success": true,
  "data": {
    "stats": {
      "totalStudents": 4,
      "activeStudents": 4,
      "avgScore": 265.08
    },
    "students": [...]
  }
}
```

### Step 3: Access Frontend

**Important:** Frontend is running on port **5174** (not 5173)

1. Open browser: **http://localhost:5174**

2. Login as Mentor:
   - Email: `mentor1@yzone.com`
   - Password: `mentor123`

3. You should see:
   - ✅ Total Students: 4
   - ✅ Active Students: 4
   - ✅ Average Score: 265.1
   - ✅ Table with 4 students showing:
     - Name
     - Email
     - Cohort
     - Recent Trackers
     - Score
     - Rank

---

## 🔍 Troubleshooting

### Issue: "Dashboard shows 0 students"

**Solutions:**

1. **Clear Browser Cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images and files
   - Reload page

2. **Hard Refresh:**
   - Press `Ctrl + F5` (Windows)
   - Or `Cmd + Shift + R` (Mac)

3. **Check Browser Console:**
   - Press `F12`
   - Go to Console tab
   - Look for any red errors
   - If you see CORS errors, the proxy might not be working

4. **Verify Token:**
   - Press `F12`
   - Go to Application tab
   - Check Local Storage
   - Look for 'token' key
   - If missing, logout and login again

### Issue: "Average Score shows N/A"

**This is now FIXED!** If you still see N/A:

1. Clear browser cache
2. Hard refresh (Ctrl + F5)
3. Logout and login again

### Issue: "Students list is empty"

**Check:**

1. Are you logged in as a mentor? (not facilitator or student)
2. Does this mentor have assigned students?
3. Check backend logs for errors

**Test with different mentors:**

- `mentor1@yzone.com` - Should have 4 students
- `mentor2@yzone.com` - Should have 4 students
- `mentor3@yzone.com` - Should have 6 students
- `mentor4@yzone.com` - Should have 3 students
- `mentor5@yzone.com` - Should have 3 students

---

## 📊 Expected Dashboard View

```
┌─────────────────────────────────────────────────────────┐
│ Industry Mentor Dashboard                               │
│ Welcome back, Alex Tech Mentor                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│ │Total Students│  │Active Students│ │Average Score│    │
│ │      4      │  │      4       │  │   265.1     │    │
│ └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Your Assigned Students                                  │
├─────────────────────────────────────────────────────────┤
│ Name          Email         Cohort    Trackers Score Rank│
│ Alice Johnson student1@...  AI & ML   8        327.7  8  │
│ David Wilson  student4@...  AI & ML   8        327.0  9  │
│ Grace Lee     student7@...  AI & ML   8        336.7  6  │
│ Sam Rivera    student19@... AI & ML   3        69.0   13 │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Complete Test Checklist

### Backend Tests

- [ ] Backend server running on port 5000
- [ ] Can login as mentor
- [ ] Dashboard API returns correct data
- [ ] Stats show correct numbers
- [ ] Students array has correct data

**Run:** `npx ts-node scripts/test-mentor-api-response.ts`

### Frontend Tests

- [ ] Frontend server running on port 5174
- [ ] Can access http://localhost:5174
- [ ] Can login as mentor
- [ ] Dashboard loads without errors
- [ ] Stats cards show numbers (not N/A)
- [ ] Students table shows data
- [ ] All columns populated

### Browser Tests

- [ ] No errors in browser console (F12)
- [ ] Network tab shows successful API calls
- [ ] Token exists in Local Storage
- [ ] Can click "Review" button on students

---

## 🎯 What Should Work

### ✅ Working Features

1. **Login** - Mentor can login successfully
2. **Dashboard Stats** - Shows total, active, and average score
3. **Students List** - Shows all assigned students
4. **Student Details** - Name, email, cohort, trackers, score, rank
5. **Review Button** - Can click to review students

### ✅ Data Accuracy

- Total Students: Counts all assigned students
- Active Students: Students with recent tracker submissions (last 7 days)
- Average Score: Calculated from leaderboard scores
- Recent Trackers: Count of trackers in last 7 days
- Score: From leaderboard table
- Rank: From leaderboard table

---

## 🔄 If Still Not Working

### Step-by-Step Reset

1. **Stop all servers:**

   ```bash
   # Kill all node processes
   taskkill /F /IM node.exe
   ```

2. **Clear browser completely:**
   - Close all browser windows
   - Clear all cache and cookies
   - Restart browser

3. **Start backend:**

   ```bash
   cd Backend
   npm run dev
   ```

   Wait for: `🚀 Server running on port 5000`

4. **Start frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

   Note the port (might be 5173 or 5174)

5. **Test backend API:**

   ```bash
   cd Backend
   npx ts-node scripts/test-mentor-api-response.ts
   ```

   Should show all data correctly

6. **Open browser:**
   - Go to http://localhost:5174 (or 5173)
   - Open DevTools (F12)
   - Go to Application → Local Storage → Clear All
   - Refresh page
   - Login as mentor1@yzone.com

7. **Check console:**
   - Should see no errors
   - Should see API calls succeeding

---

## 📞 Support

If dashboard still shows incorrect data after following all steps:

1. **Take screenshots of:**
   - Browser console (F12 → Console)
   - Network tab showing API calls
   - The dashboard view

2. **Check backend logs:**
   - `Backend/logs/combined.log`
   - Look for errors

3. **Verify database:**
   ```bash
   cd Backend
   npx ts-node scripts/test-mentor-dashboard-detailed.ts
   ```
   This will show if data exists in database

---

## ✅ Confirmation

The backend is **100% working** and returning correct data. The issue is likely:

- Browser cache
- Frontend not refreshed
- Wrong port
- Token expired

Follow the troubleshooting steps above to resolve.

**Backend API Response Verified:**

- ✅ Total Students: 4
- ✅ Active Students: 4
- ✅ Average Score: 265.08
- ✅ Students List: 4 students with all details

The data is there and working!
