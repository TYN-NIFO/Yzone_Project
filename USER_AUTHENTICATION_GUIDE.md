# 🔐 USER AUTHENTICATION GUIDE

## ✅ COMPLETE USER MANAGEMENT SYSTEM

All users can now be created and authenticated through the system!

---

## 🎭 User Roles

The system supports 5 distinct roles:

| Role                  | Code               | Description          | Access Level               |
| --------------------- | ------------------ | -------------------- | -------------------------- |
| **Tyn Executive**     | `tynExecutive`     | System Administrator | Full system access         |
| **Facilitator**       | `facilitator`      | Cohort Manager       | Manage assigned cohorts    |
| **Faculty/Principal** | `facultyPrincipal` | Academic Oversight   | View academic performance  |
| **Industry Mentor**   | `industryMentor`   | Student Mentor       | Mentor assigned students   |
| **Student**           | `student`          | Learner              | Personal progress tracking |

---

## 🚀 How to Create Users

### Method 1: Through API (Backend)

#### Create Any User

```bash
POST http://localhost:5000/api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "phone": "+1234567890",
  "whatsappNumber": "+1234567890",
  "tenantId": "tenant-uuid",
  "cohortId": "cohort-uuid"
}
```

#### Roles You Can Create:

- `tynExecutive` - System admin
- `facilitator` - Cohort manager
- `facultyPrincipal` - Academic oversight
- `industryMentor` - Student mentor
- `student` - Learner

### Method 2: Through Frontend UI

1. **Login as Admin**
   - Email: `admin@yzone.com`
   - Password: `admin123`

2. **Navigate to User Management**
   - Access the user management page
   - Click "Create User" button

3. **Fill User Details**
   - Name
   - Email
   - Password
   - Role (select from dropdown)
   - Phone (optional)
   - WhatsApp Number (optional)
   - Tenant (select institution)
   - Cohort (select cohort)

4. **Submit**
   - User is created with hashed password
   - User can now login with their credentials

---

## 🔑 Authentication Flow

### 1. User Creation

```
Admin creates user
    ↓
Password is hashed (bcrypt)
    ↓
User stored in database
    ↓
User can login
```

### 2. User Login

```
User enters email & password
    ↓
Backend verifies credentials
    ↓
Password compared with hash
    ↓
JWT token generated
    ↓
Token sent to frontend
    ↓
User authenticated
```

### 3. Authenticated Requests

```
User makes request
    ↓
JWT token included in header
    ↓
Backend verifies token
    ↓
User info extracted
    ↓
Request processed
```

---

## 📡 API Endpoints

### User Management

#### Create User

```
POST /api/users
Authorization: Bearer <token>
Roles: tynExecutive, facilitator

Body:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student|facilitator|facultyPrincipal|industryMentor|tynExecutive",
  "phone": "string (optional)",
  "whatsappNumber": "string (optional)",
  "tenantId": "string (optional)",
  "cohortId": "string (optional)"
}
```

#### Get All Users

```
GET /api/users
GET /api/users?role=student
Authorization: Bearer <token>
Roles: tynExecutive, facilitator, facultyPrincipal
```

#### Get User by ID

```
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User

```
PUT /api/users/:id
Authorization: Bearer <token>
Roles: tynExecutive, facilitator

Body:
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "whatsappNumber": "string (optional)",
  "cohortId": "string (optional)",
  "isActive": "boolean (optional)"
}
```

#### Delete User

```
DELETE /api/users/:id
Authorization: Bearer <token>
Roles: tynExecutive
```

#### Change Own Password

```
POST /api/users/change-password
Authorization: Bearer <token>

Body:
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

#### Reset User Password (Admin)

```
POST /api/users/:id/reset-password
Authorization: Bearer <token>
Roles: tynExecutive

Body:
{
  "newPassword": "string"
}
```

#### Get Users by Role

```
GET /api/users/role/:role
Authorization: Bearer <token>
Roles: tynExecutive, facilitator
```

#### Get Users by Cohort

```
GET /api/users/cohort/:cohortId
Authorization: Bearer <token>
Roles: tynExecutive, facilitator, facultyPrincipal
```

---

## 🎯 Quick Start Examples

### Example 1: Create a Student

```bash
# 1. Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yzone.com",
    "password": "admin123"
  }'

# Save the token from response

# 2. Create student
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Alice Student",
    "email": "alice@student.com",
    "password": "student123",
    "role": "student",
    "phone": "+1234567890",
    "whatsappNumber": "+1234567890"
  }'

# 3. Student can now login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@student.com",
    "password": "student123"
  }'
```

### Example 2: Create a Facilitator

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Bob Facilitator",
    "email": "bob@facilitator.com",
    "password": "facilitator123",
    "role": "facilitator",
    "phone": "+1234567890"
  }'
```

### Example 3: Create an Industry Mentor

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Carol Mentor",
    "email": "carol@mentor.com",
    "password": "mentor123",
    "role": "industryMentor",
    "phone": "+1234567890",
    "whatsappNumber": "+1234567890"
  }'
```

### Example 4: Create a Faculty/Principal

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Dr. David Principal",
    "email": "david@faculty.com",
    "password": "faculty123",
    "role": "facultyPrincipal",
    "phone": "+1234567890"
  }'
```

---

## 🔒 Security Features

### Password Security

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Never stored in plain text
- ✅ Secure comparison during login

### JWT Tokens

- ✅ Signed with secret key
- ✅ 7-day expiration (configurable)
- ✅ Contains user ID, role, tenant ID
- ✅ Verified on every request

### Role-Based Access

- ✅ Middleware checks user role
- ✅ 403 Forbidden for unauthorized access
- ✅ Each endpoint has role requirements

### Multi-Tenant Security

- ✅ All queries filtered by tenant_id
- ✅ Users can only access their tenant data
- ✅ Complete data isolation

---

## 📊 User Workflow

### For Tyn Executive:

1. Login with admin credentials
2. Create tenants (institutions)
3. Create cohorts under tenants
4. Create all types of users
5. Assign users to cohorts
6. Manage system-wide settings

### For Facilitator:

1. Login with facilitator credentials
2. View assigned cohorts
3. Create students in their cohorts
4. Manage attendance
5. Review tracker submissions

### For Faculty/Principal:

1. Login with faculty credentials
2. View academic performance
3. Monitor student progress
4. Access attendance reports

### For Industry Mentor:

1. Login with mentor credentials
2. View assigned students
3. Provide feedback and reviews
4. Track student progress

### For Student:

1. Login with student credentials
2. Submit daily tracker
3. View personal dashboard
4. Check leaderboard
5. View notifications

---

## 🎨 Frontend Integration

### User Management Page

- ✅ Create users with form
- ✅ View all users in table
- ✅ Filter by role
- ✅ Search by name/email
- ✅ Delete users
- ✅ View user details

### Login Page

- ✅ Email/password authentication
- ✅ Real backend integration
- ✅ Role-based navigation
- ✅ Error handling

---

## 🧪 Testing

### Test User Creation

```javascript
// Frontend (React)
import { userService } from "./services/user.service";

const createStudent = async () => {
  try {
    const user = await userService.createUser({
      name: "Test Student",
      email: "test@student.com",
      password: "test123",
      role: "student",
      phone: "+1234567890",
    });
    console.log("User created:", user);
  } catch (error) {
    console.error("Failed:", error);
  }
};
```

### Test User Login

```javascript
// Frontend (React)
import { authService } from "./services/auth.service";

const loginUser = async () => {
  try {
    const response = await authService.login({
      email: "test@student.com",
      password: "test123",
    });
    console.log("Logged in:", response);
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

---

## 📝 Default Credentials

### Admin (Tyn Executive)

- **Email**: `admin@yzone.com`
- **Password**: `admin123`
- **Role**: tynExecutive
- **Access**: Full system

---

## 🐛 Troubleshooting

### User Creation Fails

- ✅ Check if email already exists
- ✅ Verify role is valid
- ✅ Ensure admin is logged in
- ✅ Check tenant/cohort IDs are valid

### Login Fails

- ✅ Verify email and password
- ✅ Check user is active
- ✅ Ensure user exists in database
- ✅ Check backend is running

### Token Issues

- ✅ Token may be expired (7 days)
- ✅ Check JWT_SECRET is set
- ✅ Verify token format in header
- ✅ Re-login to get new token

---

## ✅ Checklist

- [x] User creation API
- [x] User authentication
- [x] Password hashing
- [x] JWT token generation
- [x] Role-based access control
- [x] User management endpoints
- [x] Frontend user service
- [x] User management UI
- [x] Password change
- [x] Password reset
- [x] Multi-tenant support

---

## 🎉 Status: FULLY OPERATIONAL

All users can now be created and authenticated!

**Next Steps:**

1. Login as admin
2. Create users for each role
3. Test login with created users
4. Verify role-based access
5. Start using the system

---

**System Ready**: ✅  
**User Management**: ✅  
**Authentication**: ✅  
**All Roles Supported**: ✅
