export interface MikrotikRouter {
  id: string;
  name: string;
  description?: string;
  host: string;
  port: string;
  username: string;
  password_encrypted: string;
  is_active: boolean;
  is_default: boolean;
  location?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  last_connected_at?: string;
  connection_status: 'online' | 'offline' | 'unknown';
}

export interface MikrotikRouterFormData {
  name: string;
  description?: string;
  host: string;
  port: string;
  username: string;
  password: string; // Plain password for form, will be encrypted
  is_active: boolean;
  is_default: boolean;
  location?: string;
  tags?: string[];
}
