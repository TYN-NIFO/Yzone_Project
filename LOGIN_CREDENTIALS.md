# 🔐 LOGIN CREDENTIALS

## ✅ ALL TEST USERS ARE READY!

You can now login with any of these accounts to test different roles.

---

## 👥 Available User Accounts

### 1. Tyn Executive (System Admin)

- **Email**: `admin@yzone.com`
- **Password**: `admin123`
- **Role**: `tynExecutive`
- **Access**: Full system access
- **Can Do**:
  - Create and manage tenants
  - Create and manage cohorts
  - Create all types of users
  - Assign facilitators and mentors
  - View all dashboards
  - System-wide analytics

---

### 2. Facilitator (Cohort Manager)

- **Email**: `facilitator@yzone.com`
- **Password**: `facilitator123`
- **Role**: `facilitator`
- **Access**: Cohort management
- **Can Do**:
  - View assigned cohort students
  - Create students in their cohort
  - Mark attendance
  - Review tracker submissions
  - Monitor cohort performance

---

### 3. Faculty/Principal (Academic Oversight)

- **Email**: `faculty@yzone.com`
- **Password**: `faculty123`
- **Role**: `facultyPrincipal`
- **Access**: Academic reporting
- **Can Do**:
  - View overall academic performance
  - Access attendance summaries
  - Monitor student progress
  - View cohort statistics

---

### 4. Industry Mentor (Student Mentor)

- **Email**: `mentor@yzone.com`
- **Password**: `mentor123`
- **Role**: `industryMentor`
- **Access**: Assigned students
- **Can Do**:
  - View assigned students
  - Submit reviews and feedback
  - Track student progress
  - Monitor tracker completion
  - Rate student performance

---

### 5. Student (Learner)

- **Email**: `student@yzone.com`
- **Password**: `student123`
- **Role**: `student`
- **Access**: Personal dashboard
- **Can Do**:
  - Submit daily tracker
  - Upload proof files
  - View personal progress
  - Check leaderboard ranking
  - View notifications
  - See mentor feedback

---

## 🚀 How to Login

### Method 1: Web Interface

1. Open browser: http://localhost:5173
2. Enter email and password
3. Click "Sign In"
4. You'll be redirected to role-specific dashboard

### Method 2: API (for testing)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yzone.com",
    "password": "admin123"
  }'
```

---

## 📊 Quick Test Workflow

### Step 1: Login as Admin

```
Email: admin@yzone.com
Password: admin123
```

- View system dashboard
- Create more users if needed
- Manage tenants and cohorts

### Step 2: Login as Student

```
Email: student@yzone.com
Password: student123
```

- Submit a daily tracker
- View your dashboard
- Check leaderboard

### Step 3: Login as Facilitator

```
Email: facilitator@yzone.com
Password: facilitator123
```

- View student submissions
- Monitor cohort performance

### Step 4: Login as Mentor

```
Email: mentor@yzone.com
Password: mentor123
```

- View assigned students
- Submit feedback

### Step 5: Login as Faculty

```
Email: faculty@yzone.com
Password: faculty123
```

- View academic reports
- Check attendance

---

## 🔑 Password Information

All passwords are:

- Hashed with bcrypt (10 rounds)
- Stored securely in database
- Never exposed in plain text
- Can be changed by users
- Can be reset by admin

---

## 🛠️ Create More Users

### As Admin (Tyn Executive):

1. **Login** with admin credentials
2. **Navigate** to User Management
3. **Click** "Create User"
4. **Fill** the form:
   - Name
   - Email
   - Password
   - Role (select from dropdown)
   - Phone (optional)
   - WhatsApp Number (optional)
   - Tenant
   - Cohort
5. **Submit** - User is created!

### Via API:

```bash
# Get admin token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yzone.com","password":"admin123"}' \
  | jq -r '.data.token')

# Create new user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "New Student",
    "email": "newstudent@yzone.com",
    "password": "password123",
    "role": "student",
    "phone": "+1234567890"
  }'
```

---

## 🔄 Reset Password

### For Your Own Password:

```bash
POST /api/users/change-password
Authorization: Bearer <your_token>

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Admin Reset User Password:

```bash
POST /api/users/:userId/reset-password
Authorization: Bearer <admin_token>

{
  "newPassword": "new_password"
}
```

---

## 📝 Role Comparison

| Feature          | Tyn Executive | Facilitator   | Faculty | Mentor | Student |
| ---------------- | ------------- | ------------- | ------- | ------ | ------- |
| Create Users     | ✅            | ✅ (Students) | ❌      | ❌     | ❌      |
| Manage Tenants   | ✅            | ❌            | ❌      | ❌     | ❌      |
| Manage Cohorts   | ✅            | ❌            | ❌      | ❌     | ❌      |
| View All Data    | ✅            | ❌            | ❌      | ❌     | ❌      |
| Mark Attendance  | ✅            | ✅            | ❌      | ❌     | ❌      |
| Review Trackers  | ✅            | ✅            | ✅      | ✅     | ❌      |
| Submit Tracker   | ❌            | ❌            | ❌      | ❌     | ✅      |
| Mentor Students  | ❌            | ❌            | ❌      | ✅     | ❌      |
| View Leaderboard | ✅            | ✅            | ✅      | ✅     | ✅      |

---

## 🎯 Testing Checklist

- [ ] Login as Tyn Executive
- [ ] Login as Facilitator
- [ ] Login as Faculty/Principal
- [ ] Login as Industry Mentor
- [ ] Login as Student
- [ ] Create a new user
- [ ] Submit a tracker (as student)
- [ ] View dashboard for each role
- [ ] Change password
- [ ] Reset password (as admin)

---

## 🐛 Troubleshooting

### "Invalid credentials" error?

1. ✅ Check email is correct (case-sensitive)
2. ✅ Check password is correct
3. ✅ Verify user exists in database
4. ✅ Run `npx ts-node scripts/create-admin.ts` to reset admin
5. ✅ Run `npx ts-node scripts/create-test-users.ts` to create test users

### Can't login after creating user?

1. ✅ Verify email and password used during creation
2. ✅ Check user is active (is_active = true)
3. ✅ Ensure user is not deleted (deleted_at = NULL)
4. ✅ Check backend logs for errors

### Token expired?

1. ✅ Tokens expire after 7 days
2. ✅ Login again to get new token
3. ✅ Check JWT_SECRET in .env

---

## 📚 Scripts Available

### Reset Admin User

```bash
cd Backend
npx ts-node scripts/create-admin.ts
```

### Create All Test Users

```bash
cd Backend
npx ts-node scripts/create-test-users.ts
```

---

## ✅ System Status

**Database**: ✅ Connected  
**Users Created**: ✅ 5 test users  
**Passwords**: ✅ Properly hashed  
**Authentication**: ✅ Working  
**All Roles**: ✅ Available

---

## 🎉 Ready to Use!

All credentials are set up and ready. You can now:

1. Login with any test account
2. Test different role features
3. Create more users as needed
4. Start using the system

**Default Admin**: admin@yzone.com / admin123

---

**Last Updated**: March 3, 2026  
**Status**: ✅ All Users Ready  
**Authentication**: ✅ Working
