// History & Audit Trail Types

export type ChangeType = 'profile_update' | 'plan_change' | 'status_change' | 'relocation' | 'payment' | 'activation' | 'registration';

export interface CustomerHistory {
  id: string;
  customerId: string;
  changeType: ChangeType;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  changedBy?: string;
  changedByName?: string;
  changedAt: string;
}
