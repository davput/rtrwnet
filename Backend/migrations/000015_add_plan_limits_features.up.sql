-- Add new columns to subscription_plans for detailed limits and features
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS plan_features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trial_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_public ON subscription_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_trial ON subscription_plans(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Update existing plans with default limits and features
UPDATE subscription_plans SET 
    limits = '{
        "max_customers": 50,
        "max_users": 2,
        "max_devices": 5,
        "max_bandwidth": 100,
        "max_storage": 10,
        "max_hotspots": 2,
        "max_vlans": 5,
        "max_firewall_rules": 20,
        "max_queue_rules": 10,
        "max_monitoring_days": 30,
        "max_reports": 5,
        "max_alerts": 10,
        "max_api_calls_per_hour": 100,
        "max_webhooks": 2
    }',
    plan_features = '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": false,
        "vlan_management": false,
        "firewall_management": false,
        "queue_management": true,
        "speed_boost": false,
        "real_time_monitoring": false,
        "advanced_reports": false,
        "custom_dashboard": false,
        "data_export": false,
        "alert_system": true,
        "api_access": false,
        "webhook_support": false,
        "third_party_integration": false,
        "custom_branding": false,
        "white_label": false,
        "priority_support": false,
        "phone_support": false,
        "dedicated_manager": false,
        "custom_training": false
    }',
    trial_config = '{
        "trial_days": 14,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE slug = 'starter' OR name ILIKE '%starter%' OR name ILIKE '%basic%';

UPDATE subscription_plans SET 
    limits = '{
        "max_customers": 200,
        "max_users": 5,
        "max_devices": 20,
        "max_bandwidth": 500,
        "max_storage": 50,
        "max_hotspots": 10,
        "max_vlans": 20,
        "max_firewall_rules": 100,
        "max_queue_rules": 50,
        "max_monitoring_days": 90,
        "max_reports": 20,
        "max_alerts": 50,
        "max_api_calls_per_hour": 1000,
        "max_webhooks": 10
    }',
    plan_features = '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": true,
        "vlan_management": true,
        "firewall_management": true,
        "queue_management": true,
        "speed_boost": true,
        "real_time_monitoring": true,
        "advanced_reports": true,
        "custom_dashboard": true,
        "data_export": true,
        "alert_system": true,
        "api_access": true,
        "webhook_support": true,
        "third_party_integration": false,
        "custom_branding": true,
        "white_label": false,
        "priority_support": true,
        "phone_support": false,
        "dedicated_manager": false,
        "custom_training": false
    }',
    trial_config = '{
        "trial_days": 14,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE slug = 'professional' OR name ILIKE '%professional%' OR name ILIKE '%pro%';

UPDATE subscription_plans SET 
    limits = '{
        "max_customers": -1,
        "max_users": -1,
        "max_devices": -1,
        "max_bandwidth": -1,
        "max_storage": -1,
        "max_hotspots": -1,
        "max_vlans": -1,
        "max_firewall_rules": -1,
        "max_queue_rules": -1,
        "max_monitoring_days": 365,
        "max_reports": -1,
        "max_alerts": -1,
        "max_api_calls_per_hour": -1,
        "max_webhooks": -1
    }',
    plan_features = '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": true,
        "vlan_management": true,
        "firewall_management": true,
        "queue_management": true,
        "speed_boost": true,
        "real_time_monitoring": true,
        "advanced_reports": true,
        "custom_dashboard": true,
        "data_export": true,
        "alert_system": true,
        "api_access": true,
        "webhook_support": true,
        "third_party_integration": true,
        "custom_branding": true,
        "white_label": true,
        "priority_support": true,
        "phone_support": true,
        "dedicated_manager": true,
        "custom_training": true
    }',
    trial_config = '{
        "trial_days": 30,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE slug = 'enterprise' OR name ILIKE '%enterprise%';

-- Insert Trial plan if not exists
INSERT INTO subscription_plans (id, name, slug, description, price, billing_cycle, max_customers, max_users, is_active, is_public, is_trial, sort_order, limits, plan_features, trial_config)
SELECT 
    gen_random_uuid(),
    'Trial',
    'trial',
    'Paket trial gratis selama 14 hari untuk mencoba semua fitur dasar',
    0,
    'monthly',
    25,
    1,
    true,
    true,
    true,
    0,
    '{
        "max_customers": 25,
        "max_users": 1,
        "max_devices": 3,
        "max_bandwidth": 50,
        "max_storage": 5,
        "max_hotspots": 1,
        "max_vlans": 2,
        "max_firewall_rules": 10,
        "max_queue_rules": 5,
        "max_monitoring_days": 14,
        "max_reports": 2,
        "max_alerts": 5,
        "max_api_calls_per_hour": 50,
        "max_webhooks": 1
    }',
    '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": false,
        "vlan_management": false,
        "firewall_management": false,
        "queue_management": true,
        "speed_boost": false,
        "real_time_monitoring": false,
        "advanced_reports": false,
        "custom_dashboard": false,
        "data_export": false,
        "alert_system": true,
        "api_access": false,
        "webhook_support": false,
        "third_party_integration": false,
        "custom_branding": false,
        "white_label": false,
        "priority_support": false,
        "phone_support": false,
        "dedicated_manager": false,
        "custom_training": false
    }',
    '{
        "trial_days": 14,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'trial');

COMMENT ON COLUMN subscription_plans.limits IS 'JSON object containing resource limits (max_customers, max_users, etc.)';
COMMENT ON COLUMN subscription_plans.plan_features IS 'JSON object containing feature flags (customer_management, api_access, etc.)';
COMMENT ON COLUMN subscription_plans.trial_config IS 'JSON object containing trial configuration (trial_days, auto_convert, etc.)';
