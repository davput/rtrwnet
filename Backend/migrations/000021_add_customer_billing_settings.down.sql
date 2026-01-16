-- Remove customer billing settings from tenant_settings table
ALTER TABLE tenant_settings
DROP COLUMN IF EXISTS billing_type,
DROP COLUMN IF EXISTS billing_date_type,
DROP COLUMN IF EXISTS billing_day,
DROP COLUMN IF EXISTS late_fee,
DROP COLUMN IF EXISTS late_fee_type,
DROP COLUMN IF EXISTS invoice_due_days,
DROP COLUMN IF EXISTS generate_invoice_days_before,
DROP COLUMN IF EXISTS send_suspension_warning,
DROP COLUMN IF EXISTS warning_days_before_suspension,
DROP COLUMN IF EXISTS auto_reactivate_on_payment,
DROP COLUMN IF EXISTS send_payment_confirmation;
