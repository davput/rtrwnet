-- Add hotspot fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS hotspot_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS hotspot_username VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS hotspot_password VARCHAR(255);

-- Create index for hotspot username lookup
CREATE INDEX IF NOT EXISTS idx_customers_hotspot_username ON customers(hotspot_username) WHERE hotspot_username IS NOT NULL;

-- Add comment
COMMENT ON COLUMN customers.hotspot_enabled IS 'Whether customer has hotspot access enabled';
COMMENT ON COLUMN customers.hotspot_username IS 'Hotspot login username for customer';
COMMENT ON COLUMN customers.hotspot_password IS 'Hotspot login password (plain text for customer view)';
