-- Migration to add Clerk authentication support to users table
-- This makes the system compatible with both Google OAuth and Clerk

-- Add clerk_user_id column for Clerk authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;

-- Make google_sub nullable to support Clerk-only users
ALTER TABLE users 
ALTER COLUMN google_sub DROP NOT NULL;

-- Make email nullable since Clerk users may not have email initially
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

-- Add index for faster Clerk user lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);

-- Add constraint to ensure at least one auth method is present
ALTER TABLE users 
ADD CONSTRAINT check_auth_method 
CHECK (google_sub IS NOT NULL OR clerk_user_id IS NOT NULL);
