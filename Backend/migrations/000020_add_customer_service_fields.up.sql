-- Add service type and connection fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'dhcp',
ADD COLUMN IF NOT EXISTS pppoe_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS pppoe_password VARCHAR(100),
ADD COLUMN IF NOT EXISTS static_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS static_gateway VARCHAR(45),
ADD COLUMN IF NOT EXISTS static_dns VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;

-- Update existing customers to have default service_type
UPDATE customers SET service_type = 'dhcp' WHERE service_type IS NULL;

-- Make address nullable (not required in FE)
ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;

-- Update status default to pending_activation
ALTER TABLE customers ALTER COLUMN status SET DEFAULT 'pending_activation';

-- Create index for service_type
CREATE INDEX IF NOT EXISTS idx_customers_service_type ON customers(service_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_online ON customers(is_online);
