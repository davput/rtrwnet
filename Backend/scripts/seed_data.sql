-- Seed data for development and testing

-- Insert test tenant
INSERT INTO tenants (id, name, subdomain, is_active, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Demo ISP', 'demo', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'Test ISP', 'test', true, NOW(), NOW())
ON CONFLICT (subdomain) DO NOTHING;

-- Insert test users (password: password123)
-- Password hash for 'password123' with bcrypt cost 12
INSERT INTO users (id, tenant_id, email, password, name, role, is_active, created_at, updated_at)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440000', 
     '550e8400-e29b-41d4-a716-446655440000', 
     'admin@demo.com', 
     '$2a$12$d1lLF8ARvS94LWI40nHDguNWosLyiVi9rFLxo/7QpanA2XbcAGaa.',
     'Admin User', 
     'admin', 
     true, 
     NOW(), 
     NOW()),
    ('660e8400-e29b-41d4-a716-446655440001', 
     '550e8400-e29b-41d4-a716-446655440000', 
     'operator@demo.com', 
     '$2a$12$d1lLF8ARvS94LWI40nHDguNWosLyiVi9rFLxo/7QpanA2XbcAGaa.',
     'Operator User', 
     'operator', 
     true, 
     NOW(), 
     NOW())
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Insert test service plans
INSERT INTO service_plans (id, tenant_id, name, description, speed_download, speed_upload, price, is_active, created_at, updated_at)
VALUES 
    ('770e8400-e29b-41d4-a716-446655440000',
     '550e8400-e29b-41d4-a716-446655440000',
     '10 Mbps',
     'Paket internet basic 10 Mbps',
     10,
     10,
     150000,
     true,
     NOW(),
     NOW()),
    ('770e8400-e29b-41d4-a716-446655440001',
     '550e8400-e29b-41d4-a716-446655440000',
     '20 Mbps',
     'Paket internet standard 20 Mbps',
     20,
     20,
     250000,
     true,
     NOW(),
     NOW()),
    ('770e8400-e29b-41d4-a716-446655440002',
     '550e8400-e29b-41d4-a716-446655440000',
     '50 Mbps',
     'Paket internet premium 50 Mbps',
     50,
     50,
     500000,
     true,
     NOW(),
     NOW())
ON CONFLICT DO NOTHING;

-- Display seeded data
SELECT 'Tenants:' as info;
SELECT id, name, subdomain FROM tenants;

SELECT 'Users:' as info;
SELECT id, email, name, role FROM users;

SELECT 'Service Plans:' as info;
SELECT id, name, speed_download, speed_upload, price FROM service_plans;
