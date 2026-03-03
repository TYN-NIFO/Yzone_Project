# Login "Fail to Fetch" Troubleshooting Guide

## ✅ Backend Status: WORKING

The backend API is running correctly on port 5000 and responding to requests.

## Current Setup

- **Backend:** http://localhost:5000 ✅ Running
- **Frontend:** http://localhost:5174 ✅ Running
- **API Endpoint:** http://localhost:5000/api

## Test Results

✅ Backend root endpoint working: `http://localhost:5000/`
✅ Login API working: `POST http://localhost:5000/api/auth/login`
✅ Test login successful with admin@yzone.com

## Common Causes of "Fail to Fetch"

### 1. Browser CORS Issue (Most Likely)

The backend has CORS enabled, but check browser console for CORS errors.

**Solution:** Open browser DevTools (F12) and check Console tab for errors.

### 2. Wrong API URL in Frontend

**Check:** Frontend is configured to use `http://localhost:5000/api`

**Verify:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Check if request goes to correct URL

### 3. Browser Cache

**Solution:** Hard refresh the page

- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 4. Port Mismatch

Frontend is on port 5174 (not 5173) because 5173 was in use.

## Quick Test Steps

### Step 1: Test Backend Directly

Open a new terminal and run:

```bash
curl -Method POST -Uri "http://localhost:5000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@yzone.com","password":"admin123"}'
```

Expected: Should return a token ✅ (Already tested - WORKING)

### Step 2: Test in Browser

1. Open: http://localhost:5174
2. Open DevTools (F12)
3. Go to Console tab
4. Try to login with:
   - Email: admin@yzone.com
   - Password: admin123
5. Check Console for errors
6. Check Network tab for failed requests

### Step 3: Check Network Request

In DevTools Network tab, look for:

- Request URL: Should be `http://localhost:5000/api/auth/login`
- Request Method: POST
- Status: Should be 200
- Response: Should contain token

## If Still Not Working

### Check 1: Verify .env file

File: `frontend/.env`
Should contain:

```
VITE_API_URL=http://localhost:5000/api
```

### Check 2: Restart Frontend

```bash
cd frontend
npm run dev
```

### Check 3: Check Browser Console

Look for specific error messages:

- "CORS policy" → Backend CORS issue (already fixed)
- "net::ERR_CONNECTION_REFUSED" → Backend not running
- "Failed to fetch" → Network/CORS issue

### Check 4: Try Different Browser

Sometimes browser extensions block requests. Try:

- Chrome Incognito mode
- Different browser

## Test Credentials

| Role          | Email                 | Password       |
| ------------- | --------------------- | -------------- |
| Tyn Executive | admin@yzone.com       | admin123       |
| Facilitator   | facilitator@yzone.com | facilitator123 |
| Faculty       | faculty@yzone.com     | faculty123     |
| Mentor        | mentor@yzone.com      | mentor123      |
| Student       | student@yzone.com     | student123     |

## Expected Flow

1. User enters credentials
2. Frontend sends POST to `http://localhost:5000/api/auth/login`
3. Backend validates and returns JWT token
4. Frontend stores token in localStorage
5. User redirected to role-specific dashboard

## Debug Information to Collect

If still having issues, check:

1. **Browser Console Error:**
   - Open DevTools → Console
   - Copy exact error message

2. **Network Request Details:**
   - Open DevTools → Network
   - Click on failed request
   - Copy Request URL, Status, Response

3. **Backend Logs:**
   - Check terminal running backend
   - Look for incoming requests

## Quick Fix Commands

### Restart Both Servers

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Clear Browser Data

1. Open DevTools (F12)
2. Right-click Refresh button
3. Select "Empty Cache and Hard Reload"

## Contact Points

If issue persists, provide:

1. Browser console error message
2. Network tab screenshot
3. Backend terminal output
4. Browser and version

---

## Most Likely Solution

Based on the error "fail to fetch", this is usually:

1. **CORS Issue** - Already fixed in backend ✅
2. **Browser Cache** - Try hard refresh (Ctrl+Shift+R)
3. **Wrong Port** - Frontend is on 5174, not 5173
4. **Browser Extension** - Try incognito mode

Try accessing: http://localhost:5174 (note: 5174, not 5173)
