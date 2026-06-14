-- PostgreSQL Performance Tuning for RestaurantHub
-- Run these commands as superuser after initial setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS auto_explain;
CREATE EXTENSION IF NOT EXISTS pg_prewarm;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;
CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- Create performance monitoring schema
CREATE SCHEMA IF NOT EXISTS performance_monitoring;

-- Create function to get database size information
CREATE OR REPLACE FUNCTION performance_monitoring.get_database_size_info()
RETURNS TABLE(
    database_name text,
    size_bytes bigint,
    size_pretty text,
    table_count integer,
    index_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        current_database()::text,
        pg_database_size(current_database()),
        pg_size_pretty(pg_database_size(current_database())),
        (SELECT count(*)::integer FROM information_schema.tables WHERE table_type = 'BASE TABLE'),
        (SELECT count(*)::integer FROM pg_indexes);
END;
$$ LANGUAGE plpgsql;

-- Create function to get table size information
CREATE OR REPLACE FUNCTION performance_monitoring.get_table_sizes()
RETURNS TABLE(
    schema_name text,
    table_name text,
    table_size_bytes bigint,
    table_size_pretty text,
    index_size_bytes bigint,
    index_size_pretty text,
    total_size_bytes bigint,
    total_size_pretty text,
    row_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::text,
        tablename::text,
        pg_table_size(schemaname||'.'||tablename),
        pg_size_pretty(pg_table_size(schemaname||'.'||tablename)),
        pg_indexes_size(schemaname||'.'||tablename),
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)),
        pg_total_relation_size(schemaname||'.'||tablename),
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)),
        n_tup_ins + n_tup_upd + n_tup_del as row_count
    FROM pg_tables t
    LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get slow queries
CREATE OR REPLACE FUNCTION performance_monitoring.get_slow_queries(
    min_duration_ms integer DEFAULT 1000,
    limit_rows integer DEFAULT 20
)
RETURNS TABLE(
    query text,
    calls bigint,
    total_time numeric,
    mean_time numeric,
    rows_affected bigint,
    hit_percent numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pss.query,
        pss.calls,
        round(pss.total_exec_time::numeric, 2) as total_time,
        round(pss.mean_exec_time::numeric, 2) as mean_time,
        pss.rows,
        round((pss.shared_blks_hit::numeric /
               NULLIF(pss.shared_blks_hit + pss.shared_blks_read, 0)) * 100, 2) as hit_percent
    FROM pg_stat_statements pss
    WHERE pss.mean_exec_time > min_duration_ms
    ORDER BY pss.mean_exec_time DESC
    LIMIT limit_rows;
END;
$$ LANGUAGE plpgsql;

-- Create function to get index usage statistics
CREATE OR REPLACE FUNCTION performance_monitoring.get_index_usage()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_name text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint,
    index_size_pretty text,
    usage_ratio numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::text,
        tablename::text,
        indexname::text,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_size_pretty(pg_relation_size(indexrelid)),
        CASE
            WHEN idx_scan = 0 THEN 0
            ELSE round((idx_tup_read::numeric / NULLIF(idx_scan, 0)), 2)
        END as usage_ratio
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unused indexes
CREATE OR REPLACE FUNCTION performance_monitoring.get_unused_indexes()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_name text,
    index_size_pretty text,
    index_def text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::text,
        tablename::text,
        indexname::text,
        pg_size_pretty(pg_relation_size(indexrelid)),
        indexdef::text
    FROM pg_stat_user_indexes psui
    JOIN pg_indexes pi ON pi.indexname = psui.indexname
    WHERE psui.idx_scan = 0
    AND pi.indexdef NOT LIKE '%UNIQUE%'  -- Keep unique indexes
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get table bloat information
CREATE OR REPLACE FUNCTION performance_monitoring.get_table_bloat()
RETURNS TABLE(
    schema_name text,
    table_name text,
    table_size_pretty text,
    dead_tuples bigint,
    live_tuples bigint,
    bloat_ratio numeric,
    last_vacuum timestamp with time zone,
    last_autovacuum timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::text,
        tablename::text,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)),
        n_dead_tup,
        n_live_tup,
        CASE
            WHEN n_live_tup = 0 THEN 0
            ELSE round((n_dead_tup::numeric / (n_live_tup + n_dead_tup)) * 100, 2)
        END as bloat_ratio,
        last_vacuum,
        last_autovacuum
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 0
    ORDER BY n_dead_tup DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get connection information
CREATE OR REPLACE FUNCTION performance_monitoring.get_connection_info()
RETURNS TABLE(
    current_connections integer,
    max_connections integer,
    connection_ratio numeric,
    active_connections integer,
    idle_connections integer,
    waiting_connections integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT count(*)::integer FROM pg_stat_activity),
        (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections'),
        round((SELECT count(*)::numeric FROM pg_stat_activity) /
              (SELECT setting::numeric FROM pg_settings WHERE name = 'max_connections') * 100, 2),
        (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'active'),
        (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'idle'),
        (SELECT count(*)::integer FROM pg_stat_activity WHERE wait_event IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Create function to analyze query performance
CREATE OR REPLACE FUNCTION performance_monitoring.analyze_query_performance()
RETURNS TABLE(
    metric text,
    value text,
    recommendation text
) AS $$
BEGIN
    -- Cache hit ratio
    RETURN QUERY
    SELECT
        'Cache Hit Ratio'::text,
        round((sum(blks_hit)::numeric / NULLIF(sum(blks_hit + blks_read), 0)) * 100, 2)::text || '%',
        CASE
            WHEN round((sum(blks_hit)::numeric / NULLIF(sum(blks_hit + blks_read), 0)) * 100, 2) < 95
            THEN 'Consider increasing shared_buffers'
            ELSE 'Good cache performance'
        END
    FROM pg_stat_database;

    -- Index usage
    RETURN QUERY
    SELECT
        'Index Usage Ratio'::text,
        round(avg(idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2)::text || '%',
        CASE
            WHEN round(avg(idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) < 80
            THEN 'Consider adding indexes for frequently queried columns'
            ELSE 'Good index usage'
        END
    FROM pg_stat_user_tables
    WHERE seq_scan + idx_scan > 0;

    -- Average query time
    RETURN QUERY
    SELECT
        'Average Query Time'::text,
        round(avg(mean_exec_time), 2)::text || 'ms',
        CASE
            WHEN avg(mean_exec_time) > 100
            THEN 'Consider query optimization and indexing'
            ELSE 'Good query performance'
        END
    FROM pg_stat_statements;

END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance on common queries
-- User-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON "User"(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON "User"(role);

-- Restaurant-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_owner_id ON "Restaurant"(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_created_at ON "Restaurant"(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_status ON "Restaurant"(status);

-- Job-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_restaurant_id ON "Job"(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON "Job"(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status ON "Job"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON "Job"(location);

-- Application-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_job_id ON "JobApplication"(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user_id ON "JobApplication"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON "JobApplication"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_created_at ON "JobApplication"(created_at);

-- Session and audit indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON "Session"(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON "Session"(expires_at);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_restaurant_status ON "Job"(restaurant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user_status ON "JobApplication"(user_id, status);

-- Partial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON "User"(id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_active ON "Restaurant"(id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active ON "Job"(id) WHERE deleted_at IS NULL;

-- Create view for monitoring dashboard
CREATE OR REPLACE VIEW performance_monitoring.database_health AS
SELECT
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value,
    'Monitor growth trends' as description
UNION ALL
SELECT
    'Active Connections',
    (SELECT count(*)::text FROM pg_stat_activity WHERE state = 'active'),
    'Current active connections'
UNION ALL
SELECT
    'Cache Hit Ratio',
    round((sum(blks_hit)::numeric / NULLIF(sum(blks_hit + blks_read), 0)) * 100, 2)::text || '%',
    'Should be > 95%'
FROM pg_stat_database
UNION ALL
SELECT
    'Slow Queries Count',
    (SELECT count(*)::text FROM pg_stat_statements WHERE mean_exec_time > 1000),
    'Queries taking > 1 second'
UNION ALL
SELECT
    'Unused Indexes',
    (SELECT count(*)::text FROM pg_stat_user_indexes WHERE idx_scan = 0),
    'Indexes never used';

-- Create maintenance procedures
CREATE OR REPLACE FUNCTION performance_monitoring.run_maintenance()
RETURNS text AS $$
DECLARE
    result text := '';
BEGIN
    -- Update table statistics
    ANALYZE;
    result := result || 'Statistics updated. ';

    -- Reindex if needed (check for bloat)
    FOR rec IN
        SELECT schemaname, tablename
        FROM pg_stat_user_tables
        WHERE n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0) > 0.1
    LOOP
        EXECUTE format('REINDEX TABLE %I.%I', rec.schemaname, rec.tablename);
        result := result || format('Reindexed %s.%s. ', rec.schemaname, rec.tablename);
    END LOOP;

    -- Clean up old statistics
    SELECT pg_stat_statements_reset() INTO result;
    result := result || 'Query statistics reset. ';

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to monitoring user
-- CREATE USER restauranthub_monitor WITH PASSWORD 'secure_monitor_password';
-- GRANT CONNECT ON DATABASE restauranthub TO restauranthub_monitor;
-- GRANT USAGE ON SCHEMA performance_monitoring TO restauranthub_monitor;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA performance_monitoring TO restauranthub_monitor;
-- GRANT SELECT ON ALL TABLES IN SCHEMA performance_monitoring TO restauranthub_monitor;

-- Create monitoring schedule (use with pg_cron if available)
-- SELECT cron.schedule('database-maintenance', '0 2 * * *', 'SELECT performance_monitoring.run_maintenance();');