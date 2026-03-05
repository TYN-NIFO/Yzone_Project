# WhatsApp Reminder System - Setup Guide

## Quick Start (5 Minutes)

### Step 1: Get Twilio Credentials

1. **Sign up** at https://www.twilio.com/try-twilio
2. **Verify your phone number**
3. **Get your credentials** from the Console Dashboard:
   - Account SID
   - Auth Token

### Step 2: Enable WhatsApp Sandbox (For Testing)

1. Go to **Console** → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join sandbox:
   - Send "join [sandbox-code]" to +14155238886
3. Your sandbox number: `+14155238886`

### Step 3: Configure Environment Variables

Edit `Backend/.env`:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886

# Enable reminders
ENABLE_TRACKER_REMINDERS=true
```

### Step 4: Update Student Phone Numbers

Ensure students have phone numbers with country code:

```sql
-- Update student phone numbers (example for India)
UPDATE users
SET whatsapp_number = '+91' || phone
WHERE role = 'student'
  AND phone IS NOT NULL
  AND whatsapp_number IS NULL;
```

### Step 5: Test the System

```bash
cd Backend
npm install
npm run dev
```

The cron job will start automatically and run at 10:00 PM daily.

---

## Manual Testing

### Test 1: Check Configuration

```typescript
import { TwilioWhatsAppService } from "./services/twilio-whatsapp.service";

console.log("Twilio Configured:", TwilioWhatsAppService.isConfigured());
// Should print: true
```

### Test 2: Send Test Message

```typescript
import { TwilioWhatsAppService } from "./services/twilio-whatsapp.service";

const result = await TwilioWhatsAppService.sendMessage(
  "+911234567890", // Your WhatsApp number
  "Test message from YZone System",
);

console.log("Success:", result.success);
console.log("Message ID:", result.messageId);
```

### Test 3: Check Students Without Tracker

```typescript
import { StudentValidationService } from "./services/student-validation.service";

const students =
  await StudentValidationService.getStudentsWithoutTodayTracker();
console.log("Students without tracker:", students.length);
console.log(
  "Students:",
  students.map((s) => s.name),
);
```

### Test 4: Run Reminder Job Manually

```typescript
import { DailyTrackerReminderCron } from "./cron/daily-tracker-reminder.cron";

await DailyTrackerReminderCron.runManually();
// Check console for results
```

---

## Production Setup

### Step 1: Get Approved WhatsApp Number

1. Go to Twilio Console → **Messaging** → **WhatsApp**
2. Click **Request to enable your Twilio number for WhatsApp**
3. Follow approval process (takes 1-3 business days)
4. Update `.env` with your approved number

### Step 2: Configure Message Templates (Optional)

For production, you may need to submit message templates for approval:

1. Go to **Messaging** → **WhatsApp** → **Senders**
2. Click your number → **Message Templates**
3. Create template for tracker reminder
4. Wait for approval

### Step 3: Set Production Environment

```env
NODE_ENV=production
ENABLE_TRACKER_REMINDERS=true
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### Step 4: Monitor Logs

```bash
# View logs
tail -f logs/app.log

# Check reminder statistics
psql -d yzonedb -c "
  SELECT
    DATE(sent_at) as date,
    COUNT(*) as total,
    COUNT(CASE WHEN message_sent = true THEN 1 END) as successful
  FROM tracker_reminders
  GROUP BY DATE(sent_at)
  ORDER BY date DESC
  LIMIT 7;
"
```

---

## Troubleshooting

### Issue: "Twilio not configured"

**Solution:**

- Check `.env` file has all three variables
- Restart server after updating `.env`
- Verify credentials are correct

### Issue: "Invalid phone number format"

**Solution:**

- Phone numbers must start with `+`
- Include country code: `+[country][number]`
- Example: `+911234567890` (India)

### Issue: "Number not verified" (Sandbox)

**Solution:**

- Join sandbox by sending "join [code]" to +14155238886
- Or use approved WhatsApp number

### Issue: Reminders not sending at 10 PM

**Solution:**

- Check server timezone: `date`
- Update timezone in cron job:
  ```typescript
  timezone: "Asia/Kolkata"; // Your timezone
  ```
- Verify cron is running:
  ```typescript
  console.log(DailyTrackerReminderCron.isRunning());
  ```

---

## Phone Number Format

### Correct Formats:

✅ `+911234567890` (India)
✅ `+14155551234` (USA)
✅ `+447911123456` (UK)
✅ `+971501234567` (UAE)

### Incorrect Formats:

❌ `1234567890` (missing country code)
❌ `911234567890` (missing +)
❌ `+91 1234567890` (has space)
❌ `+91-1234567890` (has dash)

---

## Cost Estimation

### Twilio Pricing (Approximate):

- **WhatsApp Message**: $0.005 per message
- **100 students/day**: $0.50/day = $15/month
- **500 students/day**: $2.50/day = $75/month

**Note**: Prices vary by country. Check Twilio pricing page.

---

## Monitoring Dashboard

### Create Monitoring Queries:

```sql
-- Today's reminder summary
SELECT
  COUNT(*) as total_sent,
  COUNT(CASE WHEN message_sent = true THEN 1 END) as successful,
  COUNT(CASE WHEN message_sent = false THEN 1 END) as failed,
  ROUND(AVG(CASE WHEN message_sent = true THEN 100 ELSE 0 END), 2) as success_rate
FROM tracker_reminders
WHERE DATE(sent_at) = CURRENT_DATE;

-- Last 7 days trend
SELECT
  DATE(sent_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN message_sent = true THEN 1 END) as successful,
  ROUND(AVG(CASE WHEN message_sent = true THEN 100 ELSE 0 END), 2) as success_rate
FROM tracker_reminders
WHERE sent_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- Failed reminders today
SELECT student_name, phone_number, error_message, sent_at
FROM tracker_reminders
WHERE DATE(sent_at) = CURRENT_DATE
  AND message_sent = false;
```

---

## Best Practices

### 1. Test in Sandbox First

- Use sandbox for development
- Test with your own number
- Verify message format

### 2. Monitor Logs

- Check logs daily
- Set up alerts for failures
- Track success rates

### 3. Handle Errors Gracefully

- System continues even if Twilio fails
- Failed messages are logged
- No impact on other students

### 4. Rate Limiting

- 1-second delay between messages
- Prevents API throttling
- Ensures reliable delivery

### 5. Database Maintenance

- Archive old reminder logs monthly
- Keep last 90 days for analysis
- Monitor table size

---

## Support

### Twilio Support:

- Documentation: https://www.twilio.com/docs/whatsapp
- Support: https://support.twilio.com/
- Status: https://status.twilio.com/

### Common Issues:

- Error codes: https://www.twilio.com/docs/api/errors
- WhatsApp limits: https://www.twilio.com/docs/whatsapp/api#rate-limits

---

## Summary

✅ **5-minute setup** with Twilio sandbox
✅ **Automatic reminders** at 10 PM daily
✅ **Comprehensive logging** for monitoring
✅ **Error handling** for reliability
✅ **Production ready** with approved numbers

Your WhatsApp reminder system is ready to use!
