-- ============================================================
-- YZONE ENTERPRISE PLATFORM — UNIFIED POSTGRESQL SCHEMA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'tynExecutive',
    'facilitator',
    'facultyPrincipal',
    'industryMentor',
    'student'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cohort_status AS ENUM ('ONGOING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tracker_status AS ENUM ('SUBMITTED', 'LATE', 'MISSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notif_type AS ENUM ('TRACKER_REMINDER', 'MENTOR_COMMENT', 'WHATSAPP_ALERT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_name    TEXT NOT NULL,
  principal_name  TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  address         TEXT,
  status          tenant_status NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);


-- ============================================================
-- COHORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  status          cohort_status NOT NULL DEFAULT 'ONGOING',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cohorts_tenant_id ON cohorts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);


-- ============================================================
-- USERS (all roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cohort_id       UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL,
  department      TEXT,
  experience_years INTEGER CHECK (experience_years >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id   ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_cohort_id   ON users(cohort_id);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);


-- ============================================================
-- MENTOR ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id       UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mentor_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_assign_mentor   ON mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assign_student  ON mentor_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assign_cohort   ON mentor_assignments(cohort_id);


-- ============================================================
-- TRACKER ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS tracker_entries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id         UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed   TEXT,
  learning_summary  TEXT,
  hours_spent       NUMERIC(4,2) CHECK (hours_spent >= 0),
  challenges        TEXT,
  proof_url         TEXT,
  status            tracker_status NOT NULL DEFAULT 'SUBMITTED',
  mentor_rating     INTEGER CHECK (mentor_rating BETWEEN 0 AND 10),
  mentor_comment    TEXT,
  submitted_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_tracker_student_id   ON tracker_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_tracker_cohort_id    ON tracker_entries(cohort_id);
CREATE INDEX IF NOT EXISTS idx_tracker_tenant_id    ON tracker_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracker_entry_date   ON tracker_entries(entry_date);


-- ============================================================
-- SESSIONS & ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id       UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  session_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_cohort_id ON sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);

CREATE TABLE IF NOT EXISTS attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status          attendance_status NOT NULL DEFAULT 'PRESENT',
  reason          TEXT,
  marked_by       UUID REFERENCES users(id),
  marked_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);


-- ============================================================
-- LEADERBOARD
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id           UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rank                INTEGER,
  tracker_score       NUMERIC(5,2) DEFAULT 0,
  attendance_score    NUMERIC(5,2) DEFAULT 0,
  mentor_rating_avg   NUMERIC(5,2) DEFAULT 0,
  performance_score   NUMERIC(5,2) DEFAULT 0,
  total_score         NUMERIC(5,2) DEFAULT 0,
  calculated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_cohort_id ON leaderboard(cohort_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_student_id ON leaderboard(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type            notif_type NOT NULL DEFAULT 'SYSTEM',
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_tenant_id ON notifications(tenant_id);


-- ============================================================
-- WHATSAPP LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,
  message         TEXT NOT NULL,
  message_status  TEXT NOT NULL DEFAULT 'SENT',
  delivery_response JSONB,
  sent_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_student_id ON whatsapp_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sent_at ON whatsapp_logs(sent_at);


-- ============================================================
-- AZURE BLOB FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS azure_blob_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  container_name  TEXT NOT NULL,
  blob_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  original_name   TEXT,
  mime_type       TEXT,
  file_size       BIGINT,
  uploaded_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blob_uploader_id ON azure_blob_files(uploader_id);
CREATE INDEX IF NOT EXISTS idx_blob_tenant_id ON azure_blob_files(tenant_id);


-- ============================================================
-- FACILITATOR → COHORT ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS facilitator_cohorts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facilitator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id       UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facilitator_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_fac_cohort_fac_id ON facilitator_cohorts(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_fac_cohort_cohort_id ON facilitator_cohorts(cohort_id);
