export type SpeedBoostStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'active' 
  | 'expired' 
  | 'cancelled';

export interface SpeedBoostRequest {
  id: string;
  customer_id: string;
  requested_speed_download: number;
  requested_speed_upload: number;
  duration_hours: number;
  price_per_hour: number;
  total_price: number;
  status: SpeedBoostStatus;
  customer_notes: string | null;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpeedBoostHistory {
  id: string;
  customer_id: string;
  customer_code: string;
  customer_name: string;
  request_id: string | null;
  original_speed_download: number;
  original_speed_upload: number;
  boosted_speed_download: number;
  boosted_speed_upload: number;
  duration_hours: number;
  started_at: string;
  expires_at: string;
  ended_at: string;
  created_at: string;
}

export interface ActiveSpeedBoost extends SpeedBoostHistory {
  customer_code: string;
  customer_name: string;
  price_per_hour: number | null;
  total_price: number | null;
  hours_remaining: number;
}

export interface CreateSpeedBoostRequest {
  customer_id: string;
  boost_speed_mbps: number;
  duration_hours: number;
  price_per_hour: number;
  notes?: string;
  requested_by: string;
}
