-- Database initialization script for RestaurantHub
-- This script creates the database and user if they don't exist

-- Create database if not exists
SELECT 'CREATE DATABASE restauranthub'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'restauranthub')\gexec

-- Create user if not exists (for development)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'restauranthub') THEN

      CREATE ROLE restauranthub LOGIN PASSWORD 'restauranthub_secret';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE restauranthub TO restauranthub;