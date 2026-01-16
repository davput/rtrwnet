-- Add plan_id column to payment_transactions for storing upgrade plan
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id ON payment_transactions(plan_id);
