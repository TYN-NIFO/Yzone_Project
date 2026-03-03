# API TESTING GUIDE

## Server Status

✅ Server is running on http://localhost:5000

## Test Endpoints

### 1. Health Check

```bash
curl http://localhost:5000
```

Expected Response:

```json
{
  "success": true,
  "message": "Yzone API running 🚀"
}
```

### 2. Login (Default Admin)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@yzone.com\",\"password\":\"admin123\"}"
```

Expected Response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Admin Executive",
      "email": "admin@yzone.com",
      "role": "tynExecutive",
      "tenantId": "uuid",
      "cohortId": null
    }
  }
}
```

### 3. Create Tenant (Requires Auth Token)

```bash
curl -X POST http://localhost:5000/api/executive/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"name\":\"Test University\",\"institutionCode\":\"TEST001\",\"contactEmail\":\"test@university.edu\",\"contactPhone\":\"+1234567890\",\"address\":\"123 Test St\"}"
```

### 4. Get Executive Dashboard

```bash
curl -X GET http://localhost:5000/api/executive/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Create Cohort

```bash
curl -X POST http://localhost:5000/api/executive/cohorts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"tenantId\":\"TENANT_UUID\",\"name\":\"Batch 2025\",\"cohortCode\":\"B2025\",\"startDate\":\"2025-01-01\",\"endDate\":\"2025-12-31\"}"
```

### 6. Create Industry Mentor

```bash
curl -X POST http://localhost:5000/api/executive/mentor/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"name\":\"John Mentor\",\"email\":\"mentor@company.com\",\"password\":\"mentor123\",\"phone\":\"+1234567890\",\"whatsappNumber\":\"+1234567890\",\"cohortId\":\"COHORT_UUID\"}"
```

### 7. Register Student

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"TENANT_UUID\",\"cohortId\":\"COHORT_UUID\",\"name\":\"Student Name\",\"email\":\"student@university.edu\",\"password\":\"student123\",\"role\":\"student\",\"phone\":\"+1234567890\",\"whatsappNumber\":\"+1234567890\"}"
```

### 8. Submit Tracker (Student)

```bash
curl -X POST http://localhost:5000/api/student/tracker \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d "{\"entryDate\":\"2025-03-03\",\"tasksCompleted\":\"Completed React tutorial\",\"learningSummary\":\"Learned about hooks\",\"hoursSpent\":8,\"challenges\":\"Understanding useEffect\"}"
```

### 9. Get Student Dashboard

```bash
curl -X GET http://localhost:5000/api/student/dashboard \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### 10. Get Leaderboard

```bash
curl -X GET http://localhost:5000/api/student/leaderboard \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

## PowerShell Testing

### Login Test

```powershell
$body = @{
    email = "admin@yzone.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.data.token
Write-Host "Token: $token"
```

### Get Dashboard with Token

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$dashboard = Invoke-RestMethod -Uri "http://localhost:5000/api/executive/dashboard" -Method GET -Headers $headers
$dashboard | ConvertTo-Json -Depth 10
```

## Testing Workflow

1. **Login as Admin**
   - Use default credentials: admin@yzone.com / admin123
   - Save the JWT token

2. **Create Tenant**
   - Use the token from step 1
   - Save the tenant ID

3. **Create Cohort**
   - Use tenant ID from step 2
   - Save the cohort ID

4. **Create Users**
   - Create facilitator
   - Create industry mentor
   - Create students

5. **Assign Mentor to Students**
   - Use the mentor assignment endpoint

6. **Test Student Features**
   - Login as student
   - Submit tracker
   - View dashboard
   - Check leaderboard

7. **Test Automated Jobs**
   - Wait for 10 PM for tracker reminders
   - Wait for midnight for leaderboard calculation
   - Or manually trigger by restarting server

## Notes

- All timestamps are in UTC
- JWT tokens expire after 7 days (configurable in .env)
- WhatsApp notifications require valid API credentials
- Azure Blob Storage requires valid connection string
- Database must be running and schema must be loaded

## Troubleshooting

### Cannot connect to database

- Check PostgreSQL is running
- Verify credentials in .env
- Ensure database 'yzonedb' exists

### 401 Unauthorized

- Token may be expired
- Token may be invalid
- Check Authorization header format: "Bearer TOKEN"

### 403 Forbidden

- User role doesn't have permission
- Check role middleware configuration

### 500 Internal Server Error

- Check server logs
- Verify database connection
- Check for missing environment variables
