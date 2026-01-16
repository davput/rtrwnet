-- Update Standard plan
UPDATE subscription_plans SET 
    limits = '{"max_customers": 100, "max_users": 3, "max_devices": 10, "max_bandwidth": 200, "max_storage": 20, "max_hotspots": 5, "max_vlans": 10, "max_firewall_rules": 50, "max_queue_rules": 25, "max_monitoring_days": 60, "max_reports": 10, "max_alerts": 25, "max_api_calls_per_hour": 500, "max_webhooks": 5}',
    plan_features = '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": true, "vlan_management": false, "firewall_management": false, "queue_management": true, "speed_boost": false, "real_time_monitoring": true, "advanced_reports": false, "custom_dashboard": false, "data_export": true, "alert_system": true, "api_access": false, "webhook_support": false, "third_party_integration": false, "custom_branding": false, "white_label": false, "priority_support": false, "phone_support": false, "dedicated_manager": false, "custom_training": false}',
    trial_config = '{"trial_days": 14, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE slug = 'standard';

-- Update Premium plan (enterprise-like)
UPDATE subscription_plans SET 
    limits = '{"max_customers": -1, "max_users": -1, "max_devices": -1, "max_bandwidth": -1, "max_storage": -1, "max_hotspots": -1, "max_vlans": -1, "max_firewall_rules": -1, "max_queue_rules": -1, "max_monitoring_days": 365, "max_reports": -1, "max_alerts": -1, "max_api_calls_per_hour": -1, "max_webhooks": -1}',
    plan_features = '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": true, "vlan_management": true, "firewall_management": true, "queue_management": true, "speed_boost": true, "real_time_monitoring": true, "advanced_reports": true, "custom_dashboard": true, "data_export": true, "alert_system": true, "api_access": true, "webhook_support": true, "third_party_integration": true, "custom_branding": true, "white_label": true, "priority_support": true, "phone_support": true, "dedicated_manager": true, "custom_training": true}',
    trial_config = '{"trial_days": 30, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE slug = 'premium';

-- Update any plans with empty limits
UPDATE subscription_plans SET 
    limits = '{"max_customers": 50, "max_users": 2, "max_devices": 5, "max_bandwidth": 100, "max_storage": 10, "max_hotspots": 2, "max_vlans": 5, "max_firewall_rules": 20, "max_queue_rules": 10, "max_monitoring_days": 30, "max_reports": 5, "max_alerts": 10, "max_api_calls_per_hour": 100, "max_webhooks": 2}'
WHERE limits IS NULL OR limits = '{}';

UPDATE subscription_plans SET 
    plan_features = '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": false, "vlan_management": false, "firewall_management": false, "queue_management": true, "speed_boost": false, "real_time_monitoring": false, "advanced_reports": false, "custom_dashboard": false, "data_export": false, "alert_system": true, "api_access": false, "webhook_support": false, "third_party_integration": false, "custom_branding": false, "white_label": false, "priority_support": false, "phone_support": false, "dedicated_manager": false, "custom_training": false}'
WHERE plan_features IS NULL OR plan_features = '{}';

UPDATE subscription_plans SET 
    trial_config = '{"trial_days": 14, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE trial_config IS NULL OR trial_config = '{}';
