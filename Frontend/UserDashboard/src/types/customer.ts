// Customer Management Types

export type CustomerStatus = 'pending_activation' | 'active' | 'suspended' | 'inactive' | 'terminated';

export interface Customer {
  id: string;
  customerCode: string;
  
  // Identity
  fullName: string;
  name?: string; // Alias for fullName from API
  nik?: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  
  // Address
  address: string;
  rt?: string;
  rw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  housePhotoUrl?: string;
  
  // Status & Service
  status: CustomerStatus;
  servicePlanId: string;
  servicePlan?: ServicePlan;
  activationDate?: string;
  terminationDate?: string;
  
  // Billing
  monthlyFee: number;
  dueDate?: string;
  lastPaymentDate?: string;
  outstandingBalance: number;
  
  // Infrastructure
  odpId?: string;
  odp?: ODP;
  odcId?: string;
  odc?: ODC;
  oltId?: string;
  olt?: OLT;
  oltPort?: string;
  onuSerial?: string;
  
  // PPPoE
  pppoeUsername: string;
  pppoePassword: string;
  
  // Connection Status (runtime)
  isOnline?: boolean;
  ipAddress?: string;
  loginTime?: string;
  sessionDuration?: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  description?: string;
  bandwidthDownload: number; // Mbps
  bandwidthUpload: number; // Mbps
  monthlyPrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  servicePlanId?: string;
  odpId?: string;
  odcId?: string;
  searchQuery?: string;
}

export interface CustomerStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  online: number;
  offline: number;
}

// Infrastructure Types
export interface OLT {
  id: string;
  name: string;
  ipAddress: string;
  location?: string;
  vendor: 'zte' | 'huawei' | 'fiberhome';
  isActive: boolean;
}

export interface ODC {
  id: string;
  name: string;
  oltId: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  isActive: boolean;
}

export interface ODP {
  id: string;
  name: string;
  odcId: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  isActive: boolean;
}
