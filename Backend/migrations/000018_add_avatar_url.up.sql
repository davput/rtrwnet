-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- Add avatar_url column to admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
