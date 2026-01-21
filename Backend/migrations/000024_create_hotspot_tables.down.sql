-- Rollback Hotspot Voucher System Tables

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_captive_portal_settings_updated_at ON captive_portal_settings;
DROP TRIGGER IF EXISTS trigger_hotspot_vouchers_updated_at ON hotspot_vouchers;
DROP TRIGGER IF EXISTS trigger_hotspot_packages_updated_at ON hotspot_packages;

-- Drop function
DROP FUNCTION IF EXISTS update_hotspot_updated_at();

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS captive_portal_settings;
DROP TABLE IF EXISTS hotspot_vouchers;
DROP TABLE IF EXISTS hotspot_packages;
