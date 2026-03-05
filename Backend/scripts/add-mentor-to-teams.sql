-- Add mentor_id column to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for mentor_id
CREATE INDEX IF NOT EXISTS idx_teams_mentor ON teams(mentor_id);

-- Add team_id column to mentor_assignments if not exists
ALTER TABLE mentor_assignments 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add index for team_id in mentor_assignments
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_team ON mentor_assignments(team_id);

-- Update existing mentor_assignments to link with teams if students are in teams
UPDATE mentor_assignments ma
SET team_id = tm.team_id
FROM team_members tm
WHERE ma.student_id = tm.student_id
AND ma.team_id IS NULL;

COMMENT ON COLUMN teams.mentor_id IS 'Mentor assigned to guide this team';
COMMENT ON COLUMN mentor_assignments.team_id IS 'Team the mentor is assigned to (if applicable)';
