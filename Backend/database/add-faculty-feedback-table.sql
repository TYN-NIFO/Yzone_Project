-- Add faculty_feedback table
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
CREATE INDEX IF NOT EXISTS idx_faculty_feedback_cohort ON faculty_feedback(cohort_id);
CREATE INDEX IF NOT EXISTS idx_faculty_feedback_date ON faculty_feedback(feedback_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_faculty_feedback_updated_at 
    BEFORE UPDATE ON faculty_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
