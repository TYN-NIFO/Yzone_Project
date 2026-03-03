-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mentor Reviews table
CREATE TABLE IF NOT EXISTS mentor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL,
  student_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  cohort_id UUID NOT NULL,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  feedback TEXT,
  review_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
);