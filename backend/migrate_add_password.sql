-- Migration: Add password_hash column to users table
-- Run this with: psql -U protego_user -d protego -f migrate_add_password.sql

-- Add password_hash column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR NOT NULL DEFAULT 'changeme';

-- Make email NOT NULL
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL;

-- Note: After running this migration, you should:
-- 1. Update existing users' passwords through the application
-- 2. Or drop and recreate the database if this is development

COMMENT ON COLUMN users.password_hash IS 'Hashed password for authentication';
