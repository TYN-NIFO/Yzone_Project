-- Add new ENUM type for MOU status
DO $$ BEGIN
    CREATE TYPE mou_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- MOU UPLOADS TABLE
CREATE TABLE IF NOT EXISTS mou_uploads (
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

-- Create indexes for MOU uploads
CREATE INDEX IF NOT EXISTS idx_mou_uploads_tenant ON mou_uploads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mou_uploads_status ON mou_uploads(status);
CREATE INDEX IF NOT EXISTS idx_mou_uploads_active ON mou_uploads(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mou_uploads_created ON mou_uploads(created_at DESC);

-- TRACKER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS tracker_feedback (
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

-- Create indexes for tracker feedback
CREATE INDEX IF NOT EXISTS idx_tracker_feedback_entry ON tracker_feedback(tracker_entry_id);
CREATE INDEX IF NOT EXISTS idx_tracker_feedback_facilitator ON tracker_feedback(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_tracker_feedback_tenant ON tracker_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracker_feedback_created ON tracker_feedback(created_at DESC);

-- Add triggers for updated_at
DO $$ BEGIN
    CREATE TRIGGER update_mou_uploads_updated_at 
    BEFORE UPDATE ON mou_uploads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_tracker_feedback_updated_at 
    BEFORE UPDATE ON tracker_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;