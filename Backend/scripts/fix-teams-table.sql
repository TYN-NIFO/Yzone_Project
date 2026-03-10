-- Fix teams table structure
-- Add missing columns to teams table

-- First, drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;

-- Add tenant_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'tenant_id') THEN
        ALTER TABLE teams ADD COLUMN tenant_id UUID;
        
        -- Update existing teams with tenant_id from their cohort
        UPDATE teams 
        SET tenant_id = c.tenant_id 
        FROM cohorts c 
        WHERE teams.cohort_id = c.id;
        
        -- Add foreign key constraint
        ALTER TABLE teams ADD CONSTRAINT fk_teams_tenant 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        
        -- Make tenant_id NOT NULL after updating
        ALTER TABLE teams ALTER COLUMN tenant_id SET NOT NULL;
        
        CREATE INDEX idx_teams_tenant ON teams(tenant_id);
    END IF;
END $$;

-- Add project_id column (but don't create projects since the table structure is different)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'project_id') THEN
        ALTER TABLE teams ADD COLUMN project_id UUID;
        
        -- For now, just set a default UUID for existing teams
        UPDATE teams 
        SET project_id = gen_random_uuid()
        WHERE project_id IS NULL;
        
        -- Make project_id NOT NULL after updating
        ALTER TABLE teams ALTER COLUMN project_id SET NOT NULL;
    END IF;
END $$;

-- Add created_at column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'created_at') THEN
        ALTER TABLE teams ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing teams with current timestamp
        UPDATE teams SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
        
        -- Make created_at NOT NULL after updating
        ALTER TABLE teams ALTER COLUMN created_at SET NOT NULL;
    END IF;
END $$;

-- Add updated_at column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'updated_at') THEN
        ALTER TABLE teams ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing teams with current timestamp
        UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
        
        -- Make updated_at NOT NULL after updating
        ALTER TABLE teams ALTER COLUMN updated_at SET NOT NULL;
    END IF;
END $$;

-- Now add the updated_at trigger for teams
CREATE TRIGGER update_teams_updated_at 
BEFORE UPDATE ON teams 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;