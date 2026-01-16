-- Drop indexes
DROP INDEX IF EXISTS idx_admin_notifications_created_at;
DROP INDEX IF EXISTS idx_admin_notifications_is_read;
DROP INDEX IF EXISTS idx_admin_notifications_admin_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_tenant_id;

-- Drop tables
DROP TABLE IF EXISTS admin_notifications;
DROP TABLE IF EXISTS notifications;
