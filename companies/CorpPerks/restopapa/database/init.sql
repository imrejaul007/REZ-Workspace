-- Production Database Initialization Script
-- RestaurantHub SaaS Platform

-- Create database if not exists
-- CREATE DATABASE restauranthub_prod;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set timezone to UTC
SET TIME ZONE 'UTC';

-- Create audit trigger function for tracking changes
CREATE OR REPLACE FUNCTION audit.create_audit_trigger()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit.activity_logs (
            table_name,
            operation,
            record_id,
            new_data,
            user_id,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::text,
            row_to_json(NEW),
            current_setting('app.current_user_id', true),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.activity_logs (
            table_name,
            operation,
            record_id,
            old_data,
            new_data,
            user_id,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::text,
            row_to_json(OLD),
            row_to_json(NEW),
            current_setting('app.current_user_id', true),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit.activity_logs (
            table_name,
            operation,
            record_id,
            old_data,
            user_id,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            OLD.id::text,
            row_to_json(OLD),
            current_setting('app.current_user_id', true),
            NOW()
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_activity_logs_table_name (table_name),
    INDEX idx_activity_logs_operation (operation),
    INDEX idx_activity_logs_record_id (record_id),
    INDEX idx_activity_logs_created_at (created_at)
);

-- Create performance monitoring functions
CREATE OR REPLACE FUNCTION analytics.get_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create backup function
CREATE OR REPLACE FUNCTION analytics.create_backup_info()
RETURNS TABLE (
    backup_name TEXT,
    size_mb NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- This would integrate with your backup system
    RETURN QUERY
    SELECT 
        'manual_backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS') as backup_name,
        ROUND((pg_database_size(current_database()) / 1024.0 / 1024.0)::numeric, 2) as size_mb,
        NOW() as created_at;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
-- These will be created automatically by Prisma, but included for reference

-- User authentication indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON "User" (email);
-- CREATE INDEX IF NOT EXISTS idx_users_phone ON "User" (phone);
-- CREATE INDEX IF NOT EXISTS idx_users_role ON "User" (role);
-- CREATE INDEX IF NOT EXISTS idx_users_active ON "User" ("isActive");

-- Restaurant indexes
-- CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON "Restaurant" ("userId");
-- CREATE INDEX IF NOT EXISTS idx_restaurants_verified ON "Restaurant" ("isVerified");
-- CREATE INDEX IF NOT EXISTS idx_restaurants_category ON "Restaurant" (category);

-- Employee indexes
-- CREATE INDEX IF NOT EXISTS idx_employees_user_id ON "Employee" ("userId");
-- CREATE INDEX IF NOT EXISTS idx_employees_verification ON "Employee" ("aadhaarVerificationStatus");

-- Job indexes
-- CREATE INDEX IF NOT EXISTS idx_jobs_restaurant_id ON "Job" ("restaurantId");
-- CREATE INDEX IF NOT EXISTS idx_jobs_status ON "Job" (status);
-- CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON "Job" ("expiresAt");

-- Discussion indexes
-- CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON "Discussion" ("userId");
-- CREATE INDEX IF NOT EXISTS idx_discussions_category ON "Discussion" (category);
-- CREATE INDEX IF NOT EXISTS idx_discussions_active ON "Discussion" ("isActive");

-- Set up connection pooling recommendations
COMMENT ON DATABASE restauranthub_prod IS 'RestaurantHub SaaS Platform Production Database';

-- Create maintenance user (for backups, monitoring)
-- CREATE USER maintenance_user WITH PASSWORD 'secure_maintenance_password';
-- GRANT CONNECT ON DATABASE restauranthub_prod TO maintenance_user;
-- GRANT USAGE ON SCHEMA public TO maintenance_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO maintenance_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO maintenance_user;