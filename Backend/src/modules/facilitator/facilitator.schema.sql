-- Enable UUID generation extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('MINI', 'MAJOR')),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING'
);

-- session table
CREATE TABLE IF NOT EXISTS sessions(
 id UUID PRIMARY KEY,
 cohort_id UUID NOT NULL,
 title TEXT NOT NULL,
 session_date DATE NOT NULL DEFAULT CURRENT_DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

 FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
 ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance(
 id UUID PRIMARY KEY,
 session_id UUID NOT NULL,
 student_id UUID NOT NULL,
 status TEXT CHECK (status IN ('PRESENT','ABSENT')),
 reason TEXT,
 marked_by UUID NOT NULL,
 marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

 FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
 FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

 UNIQUE(session_id, student_id)
);