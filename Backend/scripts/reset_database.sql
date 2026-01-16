-- Reset database for fresh start

-- Delete all data (in correct order due to foreign keys)
DELETE FROM payments;
DELETE FROM customers;
DELETE FROM service_plans;
DELETE FROM users;
DELETE FROM tenants;

-- Reset sequences if needed
-- (PostgreSQL with UUID doesn't need this, but keeping for reference)

-- Verify all tables are empty
SELECT 'Tenants count:' as info, COUNT(*) as count FROM tenants;
SELECT 'Users count:' as info, COUNT(*) as count FROM users;
SELECT 'Service Plans count:' as info, COUNT(*) as count FROM service_plans;
SELECT 'Customers count:' as info, COUNT(*) as count FROM customers;
SELECT 'Payments count:' as info, COUNT(*) as count FROM payments;
