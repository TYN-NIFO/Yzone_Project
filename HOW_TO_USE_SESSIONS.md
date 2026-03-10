# 📚 How to Use Session Management - Step by Step Guide

## Understanding Sessions

**Important:** Sessions are created for the ENTIRE COHORT, not for individual students.

Think of it like a real classroom:

- You schedule a class session (e.g., "Introduction to React")
- The session is for ALL students in the class
- After the session, you mark who was present and who was absent

---

## Step-by-Step: Creating and Managing Sessions

### Step 1: Create a Session

1. **Login as Facilitator:**
   - Email: `facilitator1@yzone.com`
   - Password: `facilitator123`

2. **Go to Sessions Tab:**
   - Click "Sessions" in the navigation

3. **Click "Create Session" Button:**
   - A modal will open

4. **Fill in Session Details:**

   ```
   Session Title: Introduction to React Hooks
   Session Date: 2026-03-06 (or any date)
   Description: Learn about useState and useEffect (optional)
   ```

5. **Click "Create Session":**
   - Session is created for the ENTIRE cohort
   - All students in the cohort can now see this session

6. **Result:**
   - Session appears in the sessions list
   - Shows: Title, Date, Total Students, Attendance Status

---

### Step 2: Mark Attendance for a Session

**This is where you select which students were present!**

1. **Find Your Session:**
   - Look in the sessions list
   - Find "Introduction to React Hooks"

2. **Click the Green Checkmark Icon:**
   - Button says "Mark Attendance"
   - Located on the right side of the session card

3. **Attendance Modal Opens:**
   - Shows ALL students in your cohort
   - Each student has a Present/Absent button

4. **Mark Each Student:**

   ```
   ☑ Alice Johnson     [Present]  ← Click to toggle
   ☑ Bob Smith         [Present]
   ☐ Carol Davis       [Absent]   ← Click to toggle
   ☑ David Wilson      [Present]
   ```

5. **Quick Actions (Optional):**
   - Click "Mark All Present" - Sets everyone to present
   - Click "Mark All Absent" - Sets everyone to absent
   - Then adjust individual students as needed

6. **Save Attendance:**
   - Click "Save Attendance" button
   - Attendance is saved to database

7. **Result:**
   - Session now shows attendance statistics
   - Green progress bar shows percentage
   - "6 present out of 8" displayed

---

## Visual Workflow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: CREATE SESSION                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sessions Tab → [Create Session] Button                │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Create New Session              [×] │              │
│  ├─────────────────────────────────────┤              │
│  │ Session Title *                     │              │
│  │ ┌─────────────────────────────────┐ │              │
│  │ │ Introduction to React Hooks     │ │              │
│  │ └─────────────────────────────────┘ │              │
│  │                                     │              │
│  │ Session Date *                      │              │
│  │ ┌─────────────────────────────────┐ │              │
│  │ │ 2026-03-06                      │ │              │
│  │ └─────────────────────────────────┘ │              │
│  │                                     │              │
│  │ [Create Session]  [Cancel]         │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ✅ Session created for ENTIRE cohort                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 2: MARK ATTENDANCE                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Find session → Click [✓] Mark Attendance              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Mark Attendance                 [×] │              │
│  │ Introduction to React Hooks         │              │
│  │ March 6, 2026                       │              │
│  ├─────────────────────────────────────┤              │
│  │ 6 of 8 marked present               │              │
│  │ [Mark All Present] [Mark All Absent]│              │
│  ├─────────────────────────────────────┤              │
│  │                                     │              │
│  │ ☑ Alice Johnson        [Present]   │ ← Toggle     │
│  │ ☑ Bob Smith            [Present]   │              │
│  │ ☐ Carol Davis          [Absent]    │ ← Toggle     │
│  │ ☑ David Wilson         [Present]   │              │
│  │ ☑ Emma Brown           [Present]   │              │
│  │ ☐ Frank Miller         [Absent]    │              │
│  │ ☑ Grace Lee            [Present]   │              │
│  │ ☑ Henry Taylor         [Present]   │              │
│  │                                     │              │
│  ├─────────────────────────────────────┤              │
│  │ [Save Attendance]  [Cancel]        │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ✅ Attendance saved for this session                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ RESULT: SESSION WITH ATTENDANCE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │ Introduction to React Hooks            [✓][🗑]│      │
│  │ 📅 March 6, 2026  👥 8 students  ⏰ 8 marked│      │
│  │                                             │      │
│  │ Attendance: 75%                             │      │
│  │ ████████████████████░░░░                    │      │
│  │ 6 present out of 8                          │      │
│  └─────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Common Questions

### Q: Why can't I select students when creating a session?

**A:** Because sessions are for the entire cohort! Just like in a real classroom, you schedule a class for everyone, then mark who attended afterward.

### Q: When do I select which students?

**A:** When marking attendance! After the session happens, click "Mark Attendance" and select who was present/absent.

### Q: Can I change attendance later?

**A:** Yes! Click "Mark Attendance" again on the same session and update the attendance. It will save the new values.

### Q: What if a student joins late?

**A:** No problem! The session is for the whole cohort. When you mark attendance, all current students in the cohort will appear in the list.

### Q: Do I need to create a session every day?

**A:** Only if you want to track attendance for that day. You can create sessions as needed - daily, weekly, or per topic.

---

## Real-World Example

**Scenario:** You're teaching a React course to 8 students.

**Monday Morning:**

1. Create session: "Day 1 - React Basics"
2. Teach the class
3. After class, mark attendance:
   - 7 students present
   - 1 student absent

**Tuesday Morning:**

1. Create session: "Day 2 - React Hooks"
2. Teach the class
3. After class, mark attendance:
   - 8 students present
   - 0 students absent

**Result:**

- You have 2 sessions in your list
- Each shows attendance statistics
- You can see attendance trends over time

---

## Troubleshooting

### "I don't see the Mark Attendance button"

**Solution:** Look for the green checkmark icon (✓) on the right side of each session card.

### "The attendance modal is empty"

**Solution:** Make sure students are added to your cohort first. Go to Students tab and add students.

### "I marked attendance but it's not saving"

**Solution:**

1. Check that you clicked "Save Attendance" (not Cancel)
2. Check browser console for errors
3. Verify backend server is running

### "Can I mark attendance before the session date?"

**Solution:** Yes! The system allows you to mark attendance for any session, regardless of date. This is useful for:

- Pre-marking expected attendance
- Updating past sessions
- Correcting mistakes

---

## Summary

✅ **Create Session** = Schedule for entire cohort
✅ **Mark Attendance** = Select who was present/absent
✅ **Update Anytime** = Can change attendance later
✅ **View Statistics** = See attendance percentages

This is the standard way attendance systems work in educational platforms!
