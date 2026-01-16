-- Service Plan Advanced Settings for burst and QoS
CREATE TABLE IF NOT EXISTS service_plan_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_plan_id UUID NOT NULL UNIQUE REFERENCES service_plans(id) ON DELETE CASCADE,
    burst_enabled BOOLEAN DEFAULT FALSE,
    burst_limit INTEGER DEFAULT 0, -- in Mbps
    burst_threshold INTEGER DEFAULT 0, -- in Mbps
    burst_time INTEGER DEFAULT 10, -- in seconds
    priority INTEGER DEFAULT 8,
    max_connections INTEGER DEFAULT 0,
    address_pool VARCHAR(64),
    dns_servers JSONB DEFAULT '[]',
    transparent_proxy BOOLEAN DEFAULT FALSE,
    queue_type VARCHAR(32) DEFAULT 'pcq',
    parent_queue VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_plan_advanced_settings_plan_id ON service_plan_advanced_settings(service_plan_id);

COMMENT ON TABLE service_plan_advanced_settings IS 'Advanced QoS settings for service plans';
