-- Drop FreeRADIUS schema
DROP TRIGGER IF EXISTS trigger_sync_hotspot_voucher ON hotspot_vouchers;
DROP TRIGGER IF EXISTS trigger_sync_radius_user ON radius_users;
DROP FUNCTION IF EXISTS sync_hotspot_voucher_to_radcheck();
DROP FUNCTION IF EXISTS sync_radius_user_to_radcheck();
DROP VIEW IF EXISTS active_sessions;
DROP TABLE IF EXISTS radpostauth;
DROP TABLE IF EXISTS radacct;
DROP TABLE IF EXISTS radusergroup;
DROP TABLE IF EXISTS radgroupreply;
DROP TABLE IF EXISTS radgroupcheck;
DROP TABLE IF EXISTS radreply;
DROP TABLE IF EXISTS radcheck;
