-- Test Script: Upgrade Flow
-- Run this script to verify the upgrade flow works correctly

-- 1. Check if plan_id column exists in payment_transactions
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' AND column_name = 'plan_id';

-- 2. Check current subscription for a tenant
-- Replace 'YOUR_TENANT_ID' with actual tenant ID
SELECT 
    ts.id as subscription_id,
    ts.tenant_id,
    ts.plan_id as current_plan_id,
    sp.name as current_plan_name,
    sp.slug as current_plan_slug,
    ts.status,
    ts.updated_at
FROM tenant_subscriptions ts
JOIN subscription_plans sp ON ts.plan_id = sp.id
WHERE ts.tenant_id = 'YOUR_TENANT_ID';

-- 3. Check pending transactions with plan_id
SELECT 
    pt.id,
    pt.order_id,
    pt.tenant_id,
    pt.subscription_id,
    pt.plan_id as upgrade_to_plan_id,
    sp.name as upgrade_to_plan_name,
    pt.amount,
    pt.status,
    pt.created_at
FROM payment_transactions pt
LEFT JOIN subscription_plans sp ON pt.plan_id = sp.id
WHERE pt.status = 'pending'
ORDER BY pt.created_at DESC
LIMIT 10;

-- 4. Check if plan_id is being stored correctly
-- This should show transactions with plan_id set
SELECT 
    order_id,
    plan_id,
    status,
    created_at
FROM payment_transactions
WHERE plan_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verify upgrade was applied after payment
-- Check transactions that are paid and have plan_id
SELECT 
    pt.order_id,
    pt.plan_id as transaction_plan_id,
    ts.plan_id as subscription_plan_id,
    sp_tx.name as transaction_plan_name,
    sp_sub.name as subscription_plan_name,
    CASE 
        WHEN pt.plan_id = ts.plan_id THEN 'UPGRADED ✓'
        ELSE 'NOT UPGRADED ✗'
    END as upgrade_status,
    pt.paid_at,
    pt.updated_at as tx_updated,
    ts.updated_at as sub_updated
FROM payment_transactions pt
JOIN tenant_subscriptions ts ON pt.subscription_id = ts.id
LEFT JOIN subscription_plans sp_tx ON pt.plan_id = sp_tx.id
LEFT JOIN subscription_plans sp_sub ON ts.plan_id = sp_sub.id
WHERE pt.status = 'paid' AND pt.plan_id IS NOT NULL
ORDER BY pt.paid_at DESC
LIMIT 10;

-- 6. List all subscription plans for reference
SELECT id, name, slug, price FROM subscription_plans ORDER BY price;

-- 7. MANUAL FIX: If subscription not upgraded, run this to fix
-- Replace values with actual IDs
-- UPDATE tenant_subscriptions 
-- SET plan_id = 'NEW_PLAN_ID', updated_at = NOW()
-- WHERE id = 'SUBSCRIPTION_ID';
