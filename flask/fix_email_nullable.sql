-- Quick fix: Make email column nullable for Clerk users
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;
