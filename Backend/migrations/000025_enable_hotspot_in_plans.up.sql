-- Enable hotspot management feature in Trial and Starter plans

-- Update Trial plan to enable hotspot
UPDATE subscription_plans 
SET plan_features = jsonb_set(
    COALESCE(plan_features, '{}'::jsonb),
    '{hotspot_management}',
    'true'::jsonb
)
WHERE slug = 'trial' OR is_trial = true;

-- Update Starter/Basic plan to enable hotspot
UPDATE subscription_plans 
SET plan_features = jsonb_set(
    COALESCE(plan_features, '{}'::jsonb),
    '{hotspot_management}',
    'true'::jsonb
)
WHERE slug = 'starter' OR name ILIKE '%starter%' OR name ILIKE '%basic%';

-- Ensure all plans have max_hotspots limit
UPDATE subscription_plans 
SET limits = jsonb_set(
    COALESCE(limits, '{}'::jsonb),
    '{max_hotspots}',
    '1'::jsonb
)
WHERE slug = 'trial' OR is_trial = true;

UPDATE subscription_plans 
SET limits = jsonb_set(
    COALESCE(limits, '{}'::jsonb),
    '{max_hotspots}',
    '5'::jsonb
)
WHERE slug = 'starter' OR name ILIKE '%starter%' OR name ILIKE '%basic%';

COMMENT ON COLUMN subscription_plans.plan_features IS 'JSON object containing feature flags including hotspot_management for voucher system access';
