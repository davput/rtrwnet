-- Remove avatar_url column from users table
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- Remove avatar_url column from admin_users table
ALTER TABLE admin_users DROP COLUMN IF EXISTS avatar_url;
