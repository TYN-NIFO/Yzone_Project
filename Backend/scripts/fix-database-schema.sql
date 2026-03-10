-- Database Schema Fixes
-- Run this script to add missing columns and tables

-- Add mentor_id column to teams table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'mentor_id') THEN
        ALTER TABLE teams ADD COLUMN mentor_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_teams_mentor ON teams(mentor_id);
    END IF;
END $$;

-- Add team_id column to mentor_assignments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mentor_assignments' AND column_name = 'team_id') THEN
        ALTER TABLE mentor_assignments ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
        CREATE INDEX idx_mentor_assignments_team ON mentor_assignments(team_id);
    END IF;
END $$;

-- Create tracker_reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS tracker_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_sent BOOLEAN DEFAULT false,
    whatsapp_message_id VARCHAR(255),
    sent_at TIMESTAMP NULL,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, reminder_date)
);

-- Create indexes for tracker_reminders if table was just created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracker_reminders_student') THEN
        CREATE INDEX idx_tracker_reminders_student ON tracker_reminders(student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracker_reminders_date') THEN
        CREATE INDEX idx_tracker_reminders_date ON tracker_reminders(reminder_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tracker_reminders_status') THEN
        CREATE INDEX idx_tracker_reminders_status ON tracker_reminders(delivery_status);
    END IF;
END $$;

-- Add updated_at trigger for tracker_reminders if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tracker_reminders_updated_at') THEN
        CREATE TRIGGER update_tracker_reminders_updated_at 
        BEFORE UPDATE ON tracker_reminders 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;