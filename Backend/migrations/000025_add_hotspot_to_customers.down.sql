-- Remove hotspot fields from customers table
DROP INDEX IF EXISTS idx_customers_hotspot_username;
ALTER TABLE customers DROP COLUMN IF EXISTS hotspot_password;
ALTER TABLE customers DROP COLUMN IF EXISTS hotspot_username;
ALTER TABLE customers DROP COLUMN IF EXISTS hotspot_enabled;
