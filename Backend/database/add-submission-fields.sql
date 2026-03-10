-- Add submission management fields to submissions table
-- This enables facilitators to review, grade, and provide feedback on submissions

-- Add new fields to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS grade DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add index for reviewed_by for performance
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_submissions_tenant ON submissions(tenant_id);

-- Update status check constraint to include new statuses
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION'));

-- Update projects table to have proper status constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED'));

-- Add status column to projects if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

-- Add team_id and type columns to projects if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('MINI', 'MAJOR'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing submissions to have tenant_id from student
UPDATE submissions s
SET tenant_id = u.tenant_id
FROM users u
WHERE s.student_id = u.id AND s.tenant_id IS NULL;

-- Make tenant_id NOT NULL after populating
ALTER TABLE submissions ALTER COLUMN tenant_id SET NOT NULL;

COMMENT ON COLUMN submissions.reviewed_by IS 'Facilitator who reviewed the submission';
COMMENT ON COLUMN submissions.reviewed_at IS 'Timestamp when submission was reviewed';
COMMENT ON COLUMN submissions.feedback IS 'Facilitator feedback on the submission';
COMMENT ON COLUMN submissions.grade IS 'Grade out of 100';
COMMENT ON COLUMN submissions.status IS 'SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, or NEEDS_REVISION';
