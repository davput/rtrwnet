-- Remove plan_id column from payment_transactions
DROP INDEX IF EXISTS idx_payment_transactions_plan_id;
ALTER TABLE payment_transactions DROP COLUMN IF EXISTS plan_id;
