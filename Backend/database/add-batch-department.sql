-- Add batch and department fields to users table (for students)
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
