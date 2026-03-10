# 🚀 Fix Mentor Dashboard - Quick Steps

## The Problem

Industry mentor dashboard shows blank UI, but backend is working perfectly.

## The Solution

I've added debug logging to help identify the issue. Follow these steps:

---

## Step 1: Make Sure Both Servers Are Running

### Terminal 1 - Backend:

```bash
cd Backend
npm run dev
```

**Wait for:** `Server running on port 5000`

### Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

**Wait for:** `Local: http://localhost:5173/`

---

## Step 2: Clear Browser Cache

1. Open your browser
2. Press `F12` to open DevTools
3. Go to **Application** tab
4. Click **Clear storage** (left sidebar)
5. Click **Clear site data** button
6. Close DevTools
7. Press `Ctrl + Shift + R` to hard refresh

---

## Step 3: Login and Check Console

1. Go to `http://localhost:5173`
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Login with:
   - Email: `mentor1@yzone.com`
   - Password: `mentor123`

5. **Watch the console logs** - you should see:
   ```
   🔄 Loading mentor dashboard...
   🌐 API Request: { url: "http://localhost:5173/api/mentor/dashboard", ... }
   📡 Calling mentor dashboard API: /mentor/dashboard
   🌐 API Response: { status: 200, ok: true, data: {...} }
   📡 Mentor dashboard API response: { success: true, data: {...} }
   ✅ Dashboard response: { stats: {...}, students: [...] }
   ✅ Dashboard data set: { stats: {...}, students: [...] }
   ```

---

## Step 4: What You Should See

### If Working:

- **Stats Cards:**
  - Total Students: 4
  - Active Students: 4
  - Average Score: 265.1

- **Student Table:**
  - 4 students listed
  - Names, emails, scores visible

### If Still Blank:

Look at the console logs and find which step failed:

#### Scenario A: No logs at all

**Problem:** JavaScript error preventing code from running
**Solution:** Look for RED errors in console, share them with me

#### Scenario B: Logs stop at "API Request"

**Problem:** Network request failing
**Check:**

- Is backend running? (should see "Server running on port 5000")
- Network tab shows the request?
- What's the status code?

#### Scenario C: Logs show "API Error"

**Problem:** Backend returning error
**Check:**

- What's the error message in console?
- Check backend terminal for errors

#### Scenario D: Logs show "Invalid response structure"

**Problem:** API response format unexpected
**Check:**

- Look at the response data in console
- Share the response structure with me

---

## Step 5: Check Network Tab

1. In DevTools, go to **Network** tab
2. Refresh the page (F5)
3. Login again
4. Look for request to `dashboard`
5. Click on it
6. Check:
   - **Status:** Should be `200`
   - **Preview:** Should show data with stats and students
   - **Headers:** Should have `Authorization: Bearer ...`

---

## Quick Test - Backend Working?

Run this in Backend folder:

```bash
cd Backend
npx ts-node scripts/test-mentor-frontend-issue.ts
```

**Expected:** Should show "✅ All tests completed!"

If this fails, backend has an issue. If it passes, frontend has an issue.

---

## Common Issues & Fixes

### Issue 1: "Failed to fetch"

**Cause:** Backend not running
**Fix:** Start backend: `cd Backend && npm run dev`

### Issue 2: "401 Unauthorized"

**Cause:** Token expired or invalid
**Fix:**

1. Logout
2. Clear localStorage (F12 → Application → Local Storage → Clear)
3. Login again

### Issue 3: "404 Not Found"

**Cause:** Wrong API endpoint
**Fix:** Check console logs for the URL being called

### Issue 4: Blank screen, no errors

**Cause:** React component error
**Fix:** Check console for React errors (red text)

### Issue 5: Old cached version

**Cause:** Browser cache
**Fix:**

1. Clear cache (Step 2 above)
2. Hard refresh: `Ctrl + Shift + R`
3. Try incognito mode

---

## What I Changed

I added debug logging to these files:

1. `frontend/src/pages/mentor/MentorDashboard.tsx` - Dashboard component
2. `frontend/src/services/dashboard.service.ts` - API service
3. `frontend/src/services/api.service.ts` - HTTP client

Now you can see exactly where the request fails!

---

## Next Steps

1. Follow steps 1-5 above
2. Look at console logs
3. Tell me:
   - What logs you see
   - Where they stop
   - Any error messages
   - Screenshot of console if possible

Then I can help you fix the specific issue!

---

## Test Credentials

Try these mentors (all should work):

| Email             | Password  | Students |
| ----------------- | --------- | -------- |
| mentor1@yzone.com | mentor123 | 4        |
| mentor2@yzone.com | mentor123 | 4        |
| mentor3@yzone.com | mentor123 | 6        |
| mentor4@yzone.com | mentor123 | 3        |
| mentor5@yzone.com | mentor123 | 3        |

---

**Remember:** Backend is working perfectly! The issue is in the frontend or browser.
