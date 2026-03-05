# WhatsApp Reminder System Documentation

## Overview

Automated WhatsApp reminder system using Twilio API that sends daily tracker reminders to students who haven't submitted their tracker by 10:00 PM.

---

## Architecture

### Modular Components

```
Backend/src/
├── services/
│   ├── twilio-whatsapp.service.ts      # Twilio API integration
│   ├── student-validation.service.ts    # Student tracker validation
│   └── reminder-scheduler.service.ts    # Reminder orchestration
├── cron/
│   └── daily-tracker-reminder.cron.ts   # Scheduled job (10 PM daily)
└── app.ts                               # Cron job initialization
```

---

## 1. Twilio WhatsApp Service

**File**: `Backend/src/services/twilio-whatsapp.service.ts`

### Features:

- ✅ Twilio SDK integration
- ✅ Environment variable configuration
- ✅ Phone number validation
- ✅ Error handling and logging
- ✅ Bulk message support with rate limiting
- ✅ Custom message templates

### Methods:

#### `sendMessage(to: string, body: string)`

Sends a WhatsApp message via Twilio.

**Parameters:**

- `to`: Phone number with country code (e.g., +911234567890)
- `body`: Message content

**Returns:**

```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}
```

#### `sendTrackerReminder(studentName: string, phoneNumber: string)`

Sends the standard tracker reminder message.

**Message Template:**

```
Hi {student_name}, you have not submitted your daily tracker today.
Please submit it before 11:59 PM to avoid being marked absent.
```

#### `sendBulkMessages(messages: WhatsAppMessage[], delayMs: number)`

Sends multiple messages with rate limiting (default: 1 second delay).

#### `isConfigured()`

Checks if Twilio credentials are properly configured.

---

## 2. Student Validation Service

**File**: `Backend/src/services/student-validation.service.ts`

### Features:

- ✅ Query students without today's tracker
- ✅ Filter by cohort
- ✅ Validate WhatsApp numbers
- ✅ Tracker submission statistics

### Methods:

#### `getStudentsWithoutTodayTracker()`

Returns all active students who haven't submitted tracker today.

**SQL Logic:**

```sql
SELECT u.*,
       CASE WHEN te.entry_date = CURRENT_DATE THEN true ELSE false END as has_submitted_today
FROM users u
LEFT JOIN tracker_entries te ON te.student_id = u.id
WHERE u.role = 'student'
  AND u.is_active = true
  AND (te.entry_date IS NULL OR te.entry_date < CURRENT_DATE)
```

#### `hasValidWhatsAppNumber(student)`

Validates phone number format (must start with +).

#### `getTrackerStatistics()`

Returns submission statistics:

```typescript
{
  total_students: number;
  submitted_today: number;
  not_submitted_today: number;
  submission_rate: number;
}
```

---

## 3. Reminder Scheduler Service

**File**: `Backend/src/services/reminder-scheduler.service.ts`

### Features:

- ✅ Orchestrates reminder sending
- ✅ Prevents duplicate reminders
- ✅ Logs all reminder attempts
- ✅ Database persistence
- ✅ Error handling

### Methods:

#### `sendDailyTrackerReminders()`

Main method that:

1. Fetches students without tracker
2. Filters students with valid numbers
3. Checks for already sent reminders
4. Sends WhatsApp messages
5. Logs results to database

**Returns:**

```typescript
{
  total_students: number;
  reminders_sent: number;
  reminders_failed: number;
  students_without_numbers: number;
  logs: ReminderLog[];
}
```

#### `getTodayReminderStats()`

Returns today's reminder statistics.

#### `getStudentReminderHistory(studentId, limit)`

Returns reminder history for a specific student.

### Database Table: `tracker_reminders`

```sql
CREATE TABLE tracker_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  student_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message_sent BOOLEAN NOT NULL DEFAULT false,
  message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- `idx_tracker_reminders_student` on `student_id`
- `idx_tracker_reminders_sent_at` on `sent_at`

---

## 4. Cron Job Scheduler

**File**: `Backend/src/cron/daily-tracker-reminder.cron.ts`

### Schedule:

- **Time**: 10:00 PM (22:00) every day
- **Cron Expression**: `0 22 * * *`
- **Timezone**: Asia/Kolkata (IST)

### Features:

- ✅ Auto-start on server initialization
- ✅ Manual execution support
- ✅ Comprehensive logging
- ✅ Statistics reporting
- ✅ Error handling

### Methods:

#### `start()`

Starts the cron job with schedule.

#### `stop()`

Stops the running cron job.

#### `runManually()`

Executes the job immediately (for testing).

#### `getNextExecutionTime()`

Returns the next scheduled execution time.

---

## Configuration

### Environment Variables

Add to `Backend/.env`:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886

# Cron Job Configuration
ENABLE_TRACKER_REMINDERS=true
```

### Getting Twilio Credentials:

1. **Sign up** at https://www.twilio.com/
2. **Get Account SID and Auth Token** from Console Dashboard
3. **Enable WhatsApp Sandbox** or get approved WhatsApp number
4. **WhatsApp Sandbox Number**: `+14155238886` (for testing)

---

## Usage

### Automatic (Production)

The cron job starts automatically when the server starts:

```typescript
// In app.ts
DailyTrackerReminderCron.start();
```

### Manual Execution (Testing)

```typescript
import { DailyTrackerReminderCron } from "./cron/daily-tracker-reminder.cron";

// Run immediately
await DailyTrackerReminderCron.runManually();
```

### Disable Reminders

Set in `.env`:

```env
ENABLE_TRACKER_REMINDERS=false
```

---

## Logic Flow

### Daily Execution (10:00 PM)

```
1. Cron job triggers at 10:00 PM
   ↓
2. Query all active students
   ↓
3. Check tracker_entries for today's date
   ↓
4. Filter students without today's submission
   ↓
5. Validate WhatsApp numbers (must start with +)
   ↓
6. Check tracker_reminders to avoid duplicates
   ↓
7. Send WhatsApp message via Twilio
   ↓
8. Log result to tracker_reminders table
   ↓
9. Add 1-second delay (rate limiting)
   ↓
10. Repeat for next student
    ↓
11. Generate statistics report
    ↓
12. Log completion
```

---

## Message Format

### Standard Reminder:

```
Hi {student_name}, you have not submitted your daily tracker today.
Please submit it before 11:59 PM to avoid being marked absent.
```

### Example:

```
Hi Rahul Kumar, you have not submitted your daily tracker today.
Please submit it before 11:59 PM to avoid being marked absent.
```

---

## Duplicate Prevention

### Strategy:

1. Query `tracker_reminders` table for today's date
2. Filter out students who already received reminder
3. Only send to students without today's reminder

### SQL Check:

```sql
SELECT DISTINCT student_id
FROM tracker_reminders
WHERE student_id = ANY($1)
  AND DATE(sent_at) = CURRENT_DATE
  AND message_sent = true
```

---

## Error Handling

### Graceful Degradation:

1. **Twilio Not Configured**
   - Logs warning
   - Skips reminder job
   - Server continues running

2. **Invalid Phone Number**
   - Logs error
   - Skips that student
   - Continues with next student

3. **Twilio API Error**
   - Logs error with details
   - Saves failed attempt to database
   - Continues with next student

4. **Database Error**
   - Logs error
   - Continues reminder process
   - Logging failure doesn't stop reminders

---

## Logging

### Log Levels:

**INFO**: Normal operations

```
✓ Reminder sent to Rahul Kumar (+911234567890)
```

**WARN**: Non-critical issues

```
⚠ Student John Doe has no phone/WhatsApp number
⚠ Twilio not configured. Skipping reminder job.
```

**ERROR**: Failures

```
✗ Failed to send reminder to Jane Smith: Invalid phone number
```

### Log Output Example:

```
============================================================
Daily Tracker Reminder Job Started
Execution Time: 3/4/2026, 10:00:00 PM
============================================================
Tracker Statistics:
  Total Students: 50
  Submitted Today: 35
  Not Submitted: 15
  Submission Rate: 70%
------------------------------------------------------------
Found 15 students without today's tracker submission
Students with valid numbers: 14
Students without valid numbers: 1
Students to remind (excluding already sent): 14
✓ Reminder sent to Rahul Kumar (+911234567890)
✓ Reminder sent to Priya Sharma (+911234567891)
...
------------------------------------------------------------
Reminder Job Results:
  Total Students Without Tracker: 15
  Reminders Sent Successfully: 14
  Reminders Failed: 0
  Students Without Valid Numbers: 1
------------------------------------------------------------
Today's Reminder Statistics:
  Total Reminders: 14
  Successful: 14
  Failed: 0
  Success Rate: 100%
============================================================
Daily Tracker Reminder Job Completed Successfully
============================================================
```

---

## Security

### Best Practices:

✅ **Never hardcode credentials**

- Use environment variables only

✅ **Validate phone numbers**

- Must start with + (country code)
- Format: +[country_code][number]

✅ **Rate limiting**

- 1-second delay between messages
- Prevents Twilio rate limit errors

✅ **Error logging**

- All errors logged with context
- No sensitive data in logs

✅ **Database security**

- Parameterized queries (SQL injection prevention)
- Foreign key constraints

---

## Testing

### Test Twilio Configuration:

```typescript
import { TwilioWhatsAppService } from "./services/twilio-whatsapp.service";

// Check if configured
console.log("Configured:", TwilioWhatsAppService.isConfigured());

// Send test message
const result = await TwilioWhatsAppService.sendMessage(
  "+911234567890",
  "Test message from YZone",
);

console.log("Result:", result);
```

### Test Student Validation:

```typescript
import { StudentValidationService } from "./services/student-validation.service";

// Get students without tracker
const students =
  await StudentValidationService.getStudentsWithoutTodayTracker();
console.log("Students:", students.length);

// Get statistics
const stats = await StudentValidationService.getTrackerStatistics();
console.log("Stats:", stats);
```

### Test Manual Reminder:

```typescript
import { DailyTrackerReminderCron } from "./cron/daily-tracker-reminder.cron";

// Run manually
await DailyTrackerReminderCron.runManually();
```

---

## Monitoring

### Database Queries:

**Today's reminders:**

```sql
SELECT * FROM tracker_reminders
WHERE DATE(sent_at) = CURRENT_DATE
ORDER BY sent_at DESC;
```

**Success rate:**

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN message_sent = true THEN 1 END) as successful,
  ROUND(COUNT(CASE WHEN message_sent = true THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM tracker_reminders
WHERE DATE(sent_at) = CURRENT_DATE;
```

**Failed reminders:**

```sql
SELECT student_name, phone_number, error_message, sent_at
FROM tracker_reminders
WHERE message_sent = false
  AND DATE(sent_at) = CURRENT_DATE;
```

---

## Troubleshooting

### Issue: Reminders not sending

**Check:**

1. Twilio credentials in `.env`
2. `ENABLE_TRACKER_REMINDERS=true`
3. Server logs for errors
4. Cron job is running: `DailyTrackerReminderCron.isRunning()`

### Issue: Invalid phone number

**Solution:**

- Ensure phone numbers in database start with `+`
- Format: `+[country_code][number]`
- Example: `+911234567890` (India)

### Issue: Twilio API errors

**Common Errors:**

- `21211`: Invalid 'To' number
- `21608`: Number not verified (sandbox mode)
- `20003`: Authentication error

**Solution:**

- Verify phone number format
- Check Twilio sandbox settings
- Verify credentials

---

## Performance

### Optimization:

✅ **Rate Limiting**: 1-second delay prevents API throttling
✅ **Batch Processing**: Processes all students in one job
✅ **Indexed Queries**: Fast database lookups
✅ **Duplicate Prevention**: Avoids unnecessary API calls
✅ **Async Operations**: Non-blocking message sending

### Scalability:

- **100 students**: ~2 minutes (with 1s delay)
- **500 students**: ~9 minutes
- **1000 students**: ~17 minutes

---

## Summary

✅ **Modular Architecture**: Clean separation of concerns
✅ **Twilio Integration**: Official SDK with error handling
✅ **Automated Scheduling**: Runs daily at 10 PM
✅ **Duplicate Prevention**: One reminder per student per day
✅ **Comprehensive Logging**: All operations tracked
✅ **Database Persistence**: Full audit trail
✅ **Error Handling**: Graceful degradation
✅ **Security**: Environment variables, no hardcoded credentials
✅ **Testing Support**: Manual execution available
✅ **Production Ready**: Robust and reliable

The system is fully functional and ready for production use!
