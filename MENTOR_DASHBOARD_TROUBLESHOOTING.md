# 🔧 Industry Mentor Dashboard Troubleshooting Guide

## Issue: Mentor Dashboard Shows Blank UI

The backend API is working perfectly (verified by tests), but the frontend shows a blank screen. This guide will help you fix it.

---

## ✅ Backend Status: WORKING

All backend tests pass successfully:

- ✅ Mentor login works
- ✅ Dashboard API returns correct data
- ✅ All 5 mentors have assigned students
- ✅ CORS is configured correctly
- ✅ Authentication works

**Test Results:**

```
Mentor 1: 4 students, Avg Score: 265.08
Mentor 2: 4 students, Avg Score: 274.66
Mentor 3: 6 students, Avg Score: 267.83
Mentor 4: 3 students, Avg Score: 221.20
Mentor 5: 3 students, Avg Score: 194.08
```

---

## 🔍 Troubleshooting Steps

### Step 1: Check if Frontend is Running

```bash
cd frontend
npm run dev
```

**Expected Output:**

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**If not running:** Start the frontend server first!

---

### Step 2: Check if Backend is Running

```bash
cd Backend
npm run dev
```

**Expected Output:**

```
Server running on port 5000
```

**If not running:** Start the backend server!

---

### Step 3: Clear Browser Cache & Storage

1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Storage:
   - ✅ Local Storage
   - ✅ Session Storage
   - ✅ Cookies
4. Click "Clear site data"
5. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

### Step 4: Check Browser Console for Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)

**Common Errors & Solutions:**

#### Error: "Failed to fetch" or "Network Error"

**Cause:** Backend not running or wrong URL
**Solution:**

- Check backend is running on port 5000
- Verify `frontend/.env` has: `VITE_API_URL=http://localhost:5000/api`

#### Error: "401 Unauthorized"

**Cause:** Token expired or invalid
**Solution:**

- Logout and login again
- Clear localStorage and try again

#### Error: "CORS policy"

**Cause:** CORS not configured (unlikely, already configured)
**Solution:**

- Check `Backend/src/app.ts` has `app.use(cors())`

#### Error: "Cannot read property 'stats' of undefined"

**Cause:** API response structure mismatch
**Solution:**

- Check console logs for API response
- Verify response has `data.stats` and `data.students`

---

### Step 5: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Login as mentor
4. Look for request to `/api/mentor/dashboard`

**What to check:**

#### Request Details:

- **URL:** Should be `http://localhost:5173/api/mentor/dashboard` (proxied to 5000)
- **Method:** GET
- **Status:** Should be 200
- **Headers:** Should have `Authorization: Bearer <token>`

#### Response:

Click on the request → Preview tab

**Expected Response:**

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
        "score": 327.68,
        "rank": 8,
        "recent_trackers": 8
      }
      // ... more students
    ]
  }
}
```

**If Status is 404:**

- Backend route not registered
- Check `Backend/src/app.ts` has: `app.use("/api/mentor", mentorRoutes)`

**If Status is 500:**

- Backend error
- Check backend console for error logs

**If No Request Appears:**

- Frontend not making the API call
- Check browser console for JavaScript errors

---

### Step 6: Test Login Credentials

Try logging in with these test mentors:

| Email             | Password  | Expected Students |
| ----------------- | --------- | ----------------- |
| mentor1@yzone.com | mentor123 | 4 students        |
| mentor2@yzone.com | mentor123 | 4 students        |
| mentor3@yzone.com | mentor123 | 6 students        |
| mentor4@yzone.com | mentor123 | 3 students        |
| mentor5@yzone.com | mentor123 | 3 students        |

**All should show data immediately after login!**

---

### Step 7: Check Console Logs (Added Debug Logging)

I've added console logs to help debug. After login, check console for:

```
🔄 Loading mentor dashboard...
📡 Calling mentor dashboard API: /mentor/dashboard
📡 Mentor dashboard API response: { success: true, data: {...} }
✅ Dashboard response: { stats: {...}, students: [...] }
✅ Dashboard data set: { stats: {...}, students: [...] }
```

**If you see errors instead:**

- Copy the error message
- Check the error details in console
- Follow the error-specific solutions above

---

### Step 8: Verify Proxy Configuration

Check `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

**If missing or different:**

- Update the file
- Restart frontend server: `npm run dev`

---

### Step 9: Test Backend API Directly

Run this test script to verify backend:

```bash
cd Backend
npx ts-node scripts/test-mentor-frontend-issue.ts
```

**Expected Output:**

```
✅ Login successful
✅ Dashboard API Response
📊 Dashboard Data:
   Total Students: 4
   Active Students: 4
   Average Score: 265.08
```

**If this fails:**

- Backend has an issue
- Check backend console for errors
- Restart backend server

---

### Step 10: Check Environment Variables

**Frontend `.env` file:**

```bash
cd frontend
cat .env
```

**Should contain:**

```
VITE_API_URL=http://localhost:5000/api
```

**If missing or wrong:**

```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

**Then restart frontend:**

```bash
npm run dev
```

---

## 🚀 Quick Fix Checklist

Try these in order:

1. ✅ **Restart both servers**

   ```bash
   # Terminal 1
   cd Backend
   npm run dev

   # Terminal 2
   cd frontend
   npm run dev
   ```

2. ✅ **Clear browser cache**
   - F12 → Application → Clear Storage → Clear site data
   - Hard refresh: Ctrl + Shift + R

3. ✅ **Logout and login again**
   - Click Logout
   - Login with: mentor1@yzone.com / mentor123

4. ✅ **Check console for errors**
   - F12 → Console tab
   - Look for red errors

5. ✅ **Check network requests**
   - F12 → Network tab
   - Look for `/api/mentor/dashboard` request
   - Check status code (should be 200)

---

## 🎯 Most Common Causes

### 1. Frontend Not Running

**Symptom:** Page doesn't load at all
**Solution:** `cd frontend && npm run dev`

### 2. Backend Not Running

**Symptom:** Network errors in console
**Solution:** `cd Backend && npm run dev`

### 3. Cached Old Code

**Symptom:** Old UI or behavior
**Solution:** Clear cache + hard refresh

### 4. Wrong Port

**Symptom:** Connection refused
**Solution:** Check backend runs on 5000, frontend on 5173

### 5. Token Expired

**Symptom:** 401 errors
**Solution:** Logout and login again

---

## 📝 What I Fixed

I've updated the frontend code to add:

1. **Better Error Handling**
   - Dashboard won't crash on API errors
   - Shows empty state instead of blank screen

2. **Debug Logging**
   - Console logs show API calls and responses
   - Easier to identify where it fails

3. **Empty State UI**
   - If no students, shows friendly message
   - Better than blank screen

4. **Response Validation**
   - Checks if response has expected structure
   - Sets default empty data if invalid

---

## 🧪 Test After Fixing

1. **Login as mentor:**
   - Email: mentor1@yzone.com
   - Password: mentor123

2. **You should see:**
   - Total Students: 4
   - Active Students: 4
   - Average Score: 265.08
   - Table with 4 students

3. **If still blank:**
   - Open console (F12)
   - Look for the debug logs I added
   - Check what error appears
   - Follow the error-specific solution above

---

## 💡 Still Not Working?

If you've tried everything above and it's still blank:

1. **Take a screenshot of:**
   - Browser console (F12 → Console)
   - Network tab showing the API request
   - The blank screen

2. **Check these files exist:**

   ```bash
   frontend/src/pages/mentor/MentorDashboard.tsx
   frontend/src/services/dashboard.service.ts
   frontend/src/config/api.ts
   frontend/vite.config.ts
   ```

3. **Verify the route is registered:**
   - Check `frontend/src/AppRoutes.tsx`
   - Should have route for `/mentor`

4. **Try a different browser:**
   - Sometimes browser extensions cause issues
   - Try incognito/private mode

---

## ✅ Success Indicators

When it's working, you'll see:

1. **Console logs:**

   ```
   🔄 Loading mentor dashboard...
   📡 Calling mentor dashboard API: /mentor/dashboard
   ✅ Dashboard response: {...}
   ✅ Dashboard data set: {...}
   ```

2. **Dashboard shows:**
   - Stats cards with numbers
   - Student table with data
   - No errors in console

3. **Network tab shows:**
   - Request to `/api/mentor/dashboard`
   - Status: 200 OK
   - Response with data

---

## 📞 Need More Help?

If you're still stuck, provide:

1. Screenshot of browser console
2. Screenshot of network tab
3. Output of: `npx ts-node scripts/test-mentor-frontend-issue.ts`
4. Which step above failed

---

**Last Updated:** March 6, 2026
**Status:** Backend ✅ Working | Frontend 🔧 Troubleshooting
