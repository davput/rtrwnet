-- Remove service type and connection fields from customers table
DROP INDEX IF EXISTS idx_customers_service_type;
DROP INDEX IF EXISTS idx_customers_is_online;

ALTER TABLE customers 
DROP COLUMN IF EXISTS service_type,
DROP COLUMN IF EXISTS pppoe_username,
DROP COLUMN IF EXISTS pppoe_password,
DROP COLUMN IF EXISTS static_ip,
DROP COLUMN IF EXISTS static_gateway,
DROP COLUMN IF EXISTS static_dns,
DROP COLUMN IF EXISTS is_online,
DROP COLUMN IF EXISTS ip_address,
DROP COLUMN IF EXISTS last_seen;

-- Restore address as required
ALTER TABLE customers ALTER COLUMN address SET NOT NULL;

-- Restore status default
ALTER TABLE customers ALTER COLUMN status SET DEFAULT 'active';
