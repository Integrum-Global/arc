-- ==============================================================================
-- ARC Investment Platform - Database Initialization Script
-- ==============================================================================
-- This script runs automatically when the PostgreSQL container starts for the
-- first time. It creates required extensions and configures the database.
--
-- Note: The database and user are created by Docker using environment variables.
-- This script runs AFTER those are created, so we just need to enable extensions.
-- ==============================================================================

-- Enable pgvector extension for vector similarity search (RAG, embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable additional crypto functions (for secure token generation)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- Verify extensions are installed
-- ==============================================================================
DO $$
BEGIN
    -- Check vector extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension failed to install';
    END IF;

    -- Check uuid-ossp extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE EXCEPTION 'uuid-ossp extension failed to install';
    END IF;

    RAISE NOTICE 'All required extensions installed successfully';
END $$;

-- ==============================================================================
-- Grant permissions (if needed for additional roles)
-- ==============================================================================
-- The main user is created by Docker's POSTGRES_USER environment variable.
-- Add any additional role configurations here if needed.

-- Example: Create a read-only role for analytics
-- CREATE ROLE arc_readonly WITH LOGIN PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE arc TO arc_readonly;
-- GRANT USAGE ON SCHEMA public TO arc_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO arc_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO arc_readonly;

-- ==============================================================================
-- Performance tuning (optional, uncomment if needed)
-- ==============================================================================
-- These settings can be tuned based on your hardware and workload.
-- For production, consider setting these in postgresql.conf instead.

-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '768MB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '8MB';
-- ALTER SYSTEM SET default_statistics_target = 100;
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_io_concurrency = 200;
-- ALTER SYSTEM SET work_mem = '4MB';
-- ALTER SYSTEM SET min_wal_size = '1GB';
-- ALTER SYSTEM SET max_wal_size = '2GB';
-- ALTER SYSTEM SET max_worker_processes = 4;
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
-- ALTER SYSTEM SET max_parallel_workers = 4;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'ARC Database initialized successfully';
    RAISE NOTICE 'Extensions: vector, uuid-ossp, pg_trgm, pgcrypto';
    RAISE NOTICE '===========================================';
END $$;
