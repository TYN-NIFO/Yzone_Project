-- =============================================
-- Missing tables for Neon DB migration
-- =============================================

-- MENTOR ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS mentor_assignments (
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
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor ON mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_student ON mentor_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_cohort ON mentor_assignments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_active ON mentor_assignments(is_active) WHERE is_active = true;

-- SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','NEEDS_REVISION')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    feedback TEXT,
    grade DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_submissions_project ON submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_tenant ON submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);

-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('MINI','MAJOR'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','SUBMITTED','COMPLETED'));

-- Add missing columns to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES users(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);

-- Add missing columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(100);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TIME;

-- FACULTY FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS faculty_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    academic_rating INTEGER CHECK (academic_rating >= 1 AND academic_rating <= 5),
    behavior_rating INTEGER CHECK (behavior_rating >= 1 AND behavior_rating <= 5),
    participation_rating INTEGER CHECK (participation_rating >= 1 AND participation_rating <= 5),
    feedback TEXT NOT NULL,
    academic_comments TEXT,
    behavior_comments TEXT,
    recommendations TEXT,
    feedback_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_faculty_feedback_faculty ON faculty_feedback(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_feedback_student ON faculty_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_faculty_feedback_tenant ON faculty_feedback(tenant_id);

-- PASSWORD RESET TOKENS TABLE
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
