-- ============================================
-- RT/RW Net SaaS Backend - Drop All Tables
-- WARNING: This will delete all data!
-- ============================================

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS odps CASCADE;
DROP TABLE IF EXISTS odcs CASCADE;
DROP TABLE IF EXISTS olts CASCADE;
DROP TABLE IF EXISTS ticket_activities CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS service_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop extension (optional)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================
-- END OF DROP SCHEMA
-- ============================================
