-- Remove new columns from subscription_plans
ALTER TABLE subscription_plans 
DROP COLUMN IF EXISTS limits,
DROP COLUMN IF EXISTS plan_features,
DROP COLUMN IF EXISTS trial_config,
DROP COLUMN IF EXISTS is_public,
DROP COLUMN IF EXISTS is_trial,
DROP COLUMN IF EXISTS sort_order;

-- Drop indexes
DROP INDEX IF EXISTS idx_subscription_plans_public;
DROP INDEX IF EXISTS idx_subscription_plans_trial;
DROP INDEX IF EXISTS idx_subscription_plans_sort;
DROP INDEX IF EXISTS idx_subscription_plans_active;

-- Delete trial plan
DELETE FROM subscription_plans WHERE slug = 'trial';
