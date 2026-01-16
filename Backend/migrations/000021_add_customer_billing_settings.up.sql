-- Add customer billing settings to tenant_settings table
ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'postpaid',
ADD COLUMN IF NOT EXISTS billing_date_type VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_type VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS invoice_due_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS generate_invoice_days_before INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS send_suspension_warning BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS warning_days_before_suspension INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS auto_reactivate_on_payment BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS send_payment_confirmation BOOLEAN DEFAULT TRUE;

-- Add comments
COMMENT ON COLUMN tenant_settings.billing_type IS 'prepaid or postpaid';
COMMENT ON COLUMN tenant_settings.billing_date_type IS 'fixed (same date for all) or recycle (based on activation date)';
COMMENT ON COLUMN tenant_settings.billing_day IS 'Day of month for fixed billing (1-31)';
COMMENT ON COLUMN tenant_settings.late_fee IS 'Late fee amount or percentage';
COMMENT ON COLUMN tenant_settings.late_fee_type IS 'fixed (nominal) or percentage';
COMMENT ON COLUMN tenant_settings.invoice_due_days IS 'Days until invoice is due after creation';
COMMENT ON COLUMN tenant_settings.generate_invoice_days_before IS 'For prepaid: generate invoice X days before new period';
