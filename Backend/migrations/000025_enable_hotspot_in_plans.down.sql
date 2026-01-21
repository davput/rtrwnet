-- Rollback: Disable hotspot management in Trial and Starter plans

UPDATE subscription_plans 
SET plan_features = jsonb_set(
    COALESCE(plan_features, '{}'::jsonb),
    '{hotspot_management}',
    'false'::jsonb
)
WHERE slug = 'trial' OR is_trial = true;

UPDATE subscription_plans 
SET plan_features = jsonb_set(
    COALESCE(plan_features, '{}'::jsonb),
    '{hotspot_management}',
    'false'::jsonb
)
WHERE slug = 'starter' OR name ILIKE '%starter%' OR name ILIKE '%basic%';
