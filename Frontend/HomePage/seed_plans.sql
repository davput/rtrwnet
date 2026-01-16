-- Seed Subscription Plans
-- Run this SQL to create plans in database with IDs that match frontend

-- Delete existing plans (optional - uncomment if you want to start fresh)
-- DELETE FROM subscription_plans;

-- Insert Standard Plan
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    description,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440010',
    'Standard Plan',
    'standard',
    'Perfect for small ISPs with up to 100 customers',
    299000,
    'monthly',
    100,
    3,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    billing_cycle = EXCLUDED.billing_cycle,
    max_customers = EXCLUDED.max_customers,
    max_users = EXCLUDED.max_users,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert Premium Plan
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    description,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440011',
    'Premium Plan',
    'premium',
    'For growing ISPs with up to 500 customers',
    599000,
    'monthly',
    500,
    10,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    billing_cycle = EXCLUDED.billing_cycle,
    max_customers = EXCLUDED.max_customers,
    max_users = EXCLUDED.max_users,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert Enterprise Plan
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    description,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440012',
    'Enterprise Plan',
    'enterprise',
    'For large ISPs with unlimited customers',
    1499000,
    'monthly',
    -1,
    -1,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    billing_cycle = EXCLUDED.billing_cycle,
    max_customers = EXCLUDED.max_customers,
    max_users = EXCLUDED.max_users,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify plans were created
SELECT 
    id,
    name,
    slug,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active
FROM subscription_plans
ORDER BY price ASC;

-- Expected output:
-- id                                   | name           | slug       | price  | billing_cycle | max_customers | max_users | is_active
-- -------------------------------------|----------------|------------|--------|---------------|---------------|-----------|----------
-- 550e8400-e29b-41d4-a716-446655440010 | Standard Plan  | standard   | 299000 | monthly       | 100           | 3         | true
-- 550e8400-e29b-41d4-a716-446655440011 | Premium Plan   | premium    | 599000 | monthly       | 500           | 10        | true
-- 550e8400-e29b-41d4-a716-446655440012 | Enterprise Plan| enterprise | 1499000| monthly       | -1            | -1        | true
