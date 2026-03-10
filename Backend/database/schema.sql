-- YZONE COMPLETE DATABASE SCHEMA
-- PostgreSQL Production Schema

-- Drop existing tables if any
DROP TABLE IF EXISTS whatsapp_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS azure_blob_files CASCADE;
DROP TABLE IF EXISTS mentor_assignments CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS tracker_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS mou_status CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('tynExecutive', 'facilitator', 'facultyPrincipal', 'industryMentor', 'student');
CREATE TYPE notification_type AS ENUM ('tracker_reminder', 'mentor_comment', 'system_alert', 'whatsapp_sent');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE mou_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- TENANTS TABLE
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    institution_code VARCHAR(50) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_code ON tenants(institution_code);

-- COHORTS TABLE
CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cohort_code VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    facilitator_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE(tenant_id, cohort_code)
);

CREATE INDEX idx_cohorts_tenant ON cohorts(tenant_id);
CREATE INDEX idx_cohorts_facilitator ON cohorts(facilitator_id);
CREATE INDEX idx_cohorts_active ON cohorts(is_active) WHERE deleted_at IS NULL;

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_cohort ON users(cohort_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- Add foreign key for facilitator after users table exists
ALTER TABLE cohorts ADD CONSTRAINT fk_cohorts_facilitator 
    FOREIGN KEY (facilitator_id) REFERENCES users(id) ON DELETE SET NULL;

-- TRACKER ENTRIES TABLE
CREATE TABLE tracker_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    tasks_completed TEXT NOT NULL,
    learning_summary TEXT NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL,
    challenges TEXT,
    proof_file_url TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, entry_date)
);

CREATE INDEX idx_tracker_student ON tracker_entries(student_id);
CREATE INDEX idx_tracker_tenant ON tracker_entries(tenant_id);
CREATE INDEX idx_tracker_cohort ON tracker_entries(cohort_id);
CREATE INDEX idx_tracker_date ON tracker_entries(entry_date);
CREATE INDEX idx_tracker_submitted ON tracker_entries(submitted_at);

-- LEADERBOARD TABLE
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    total_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    tracker_consistency_score DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    attendance_score DECIMAL(5,2) DEFAULT 0,
    mentor_rating_score DECIMAL(5,2) DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cohort_id, student_id)
);

CREATE INDEX idx_leaderboard_cohort_rank ON leaderboard(cohort_id, rank);
CREATE INDEX idx_leaderboard_student ON leaderboard(student_id);
CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- WHATSAPP LOGS TABLE
CREATE TABLE whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_status message_status DEFAULT 'pending',
    whatsapp_message_id VARCHAR(255),
    delivery_response JSONB,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_user ON whatsapp_logs(user_id);
CREATE INDEX idx_whatsapp_tenant ON whatsapp_logs(tenant_id);
CREATE INDEX idx_whatsapp_status ON whatsapp_logs(message_status);
CREATE INDEX idx_whatsapp_sent ON whatsapp_logs(sent_at DESC);

-- MENTOR ASSIGNMENTS TABLE
CREATE TABLE mentor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentor_id, student_id, cohort_id)
);

CREATE INDEX idx_mentor_assignments_mentor ON mentor_assignments(mentor_id);
CREATE INDEX idx_mentor_assignments_student ON mentor_assignments(student_id);
CREATE INDEX idx_mentor_assignments_cohort ON mentor_assignments(cohort_id);
CREATE INDEX idx_mentor_assignments_team ON mentor_assignments(team_id);
CREATE INDEX idx_mentor_assignments_active ON mentor_assignments(is_active) WHERE is_active = true;

-- AZURE BLOB FILES TABLE
CREATE TABLE azure_blob_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tracker_entry_id UUID REFERENCES tracker_entries(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    blob_url TEXT NOT NULL,
    container_name VARCHAR(255) NOT NULL,
    blob_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_azure_files_user ON azure_blob_files(user_id);
CREATE INDEX idx_azure_files_tenant ON azure_blob_files(tenant_id);
CREATE INDEX idx_azure_files_tracker ON azure_blob_files(tracker_entry_id);
CREATE INDEX idx_azure_files_uploaded ON azure_blob_files(uploaded_at DESC);

-- SESSIONS TABLE (for attendance tracking)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facilitator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_cohort ON sessions(cohort_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);

-- ATTENDANCE TABLE
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT false,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_cohort ON attendance(cohort_id);

-- PROJECTS TABLE
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_cohort ON projects(cohort_id);
CREATE INDEX idx_projects_active ON projects(is_active);

-- TEAMS TABLE
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_project ON teams(project_id);
CREATE INDEX idx_teams_cohort ON teams(cohort_id);
CREATE INDEX idx_teams_mentor ON teams(mentor_id);

-- TEAM MEMBERS TABLE
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, student_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_student ON team_members(student_id);

-- MENTOR REVIEWS TABLE
CREATE TABLE mentor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    feedback TEXT,
    review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mentor_reviews_mentor ON mentor_reviews(mentor_id);
CREATE INDEX idx_mentor_reviews_student ON mentor_reviews(student_id);
CREATE INDEX idx_mentor_reviews_cohort ON mentor_reviews(cohort_id);

-- MOU UPLOADS TABLE
CREATE TABLE mou_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    status mou_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    expiry_date DATE,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_mou_uploads_tenant ON mou_uploads(tenant_id);
CREATE INDEX idx_mou_uploads_status ON mou_uploads(status);
CREATE INDEX idx_mou_uploads_active ON mou_uploads(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_mou_uploads_created ON mou_uploads(created_at DESC);

-- TRACKER REMINDERS TABLE (for WhatsApp reminder system)
CREATE TABLE tracker_reminders (
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

CREATE INDEX idx_tracker_reminders_student ON tracker_reminders(student_id);
CREATE INDEX idx_tracker_reminders_date ON tracker_reminders(reminder_date);
CREATE INDEX idx_tracker_reminders_status ON tracker_reminders(delivery_status);

-- TRACKER FEEDBACK TABLE
CREATE TABLE tracker_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_entry_id UUID NOT NULL REFERENCES tracker_entries(id) ON DELETE CASCADE,
    facilitator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    suggestions TEXT,
    is_approved BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracker_feedback_entry ON tracker_feedback(tracker_entry_id);
CREATE INDEX idx_tracker_feedback_facilitator ON tracker_feedback(facilitator_id);
CREATE INDEX idx_tracker_feedback_tenant ON tracker_feedback(tenant_id);
CREATE INDEX idx_tracker_feedback_created ON tracker_feedback(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracker_entries_updated_at BEFORE UPDATE ON tracker_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_assignments_updated_at BEFORE UPDATE ON mentor_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_reviews_updated_at BEFORE UPDATE ON mentor_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mou_uploads_updated_at BEFORE UPDATE ON mou_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracker_feedback_updated_at BEFORE UPDATE ON tracker_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO tenants (name, institution_code, contact_email, contact_phone) VALUES
('Tech University', 'TECH001', 'admin@techuni.edu', '+1234567890');

-- Get the tenant ID for sample data
DO $$
DECLARE
    tenant_uuid UUID;
BEGIN
    SELECT id INTO tenant_uuid FROM tenants WHERE institution_code = 'TECH001';
    
    -- Insert sample tynExecutive user (password: admin123)
    INSERT INTO users (tenant_id, name, email, password_hash, role, phone, whatsapp_number) VALUES
    (tenant_uuid, 'Admin Executive', 'admin@yzone.com', '$2b$10$rKvVJKxZ8xGxH5qZ5qZ5qOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'tynExecutive', '+1234567890', '+1234567890');
END $$;
