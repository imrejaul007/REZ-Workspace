-- PostgreSQL initialization script for RestaurantHub
-- This script sets up initial database configuration and extensions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create additional schemas if needed
CREATE SCHEMA IF NOT EXISTS "analytics";
CREATE SCHEMA IF NOT EXISTS "audit";

-- Set timezone
SET timezone = 'UTC';

-- Create audit function for tracking changes
CREATE OR REPLACE FUNCTION audit.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            new_data,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(NEW),
            current_setting('app.current_user_id', true)::uuid,
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            old_data,
            new_data,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            current_setting('app.current_user_id', true)::uuid,
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            old_data,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            current_setting('app.current_user_id', true)::uuid,
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit.audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit.audit_log(user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA audit TO PUBLIC;
GRANT SELECT ON audit.audit_log TO PUBLIC;