-- Remove onboarding fields from tenants table
ALTER TABLE tenants DROP COLUMN IF EXISTS onboarding_completed;
ALTER TABLE tenants DROP COLUMN IF EXISTS onboarding_step;
