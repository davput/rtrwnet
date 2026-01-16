// Customer Service - Mock Implementation
import type { Customer, CustomerFilters, CustomerStats, ServicePlan } from '@/types';
import { mockCustomers, mockServicePlans, mockOLTs, mockODCs, mockODPs } from './mockData';

class CustomerService {
  private customers: Customer[] = [...mockCustomers];

  // Get all customers with filters
  getCustomers(filters?: CustomerFilters): Customer[] {
    let filtered = [...this.customers];

    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters?.servicePlanId) {
      filtered = filtered.filter(c => c.servicePlanId === filters.servicePlanId);
    }

    if (filters?.odpId) {
      filtered = filtered.filter(c => c.odpId === filters.odpId);
    }

    if (filters?.odcId) {
      filtered = filtered.filter(c => c.odcId === filters.odcId);
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.fullName.toLowerCase().includes(query) ||
        c.customerCode.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
    }

    // Populate service plan
    filtered = filtered.map(customer => ({
      ...customer,
      servicePlan: mockServicePlans.find(p => p.id === customer.servicePlanId),
      olt: mockOLTs.find(o => o.id === customer.oltId),
      odc: mockODCs.find(o => o.id === customer.odcId),
      odp: mockODPs.find(o => o.id === customer.odpId),
    }));

    return filtered;
  }

  // Get customer by ID
  getCustomer(id: string): Customer | undefined {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return undefined;

    return {
      ...customer,
      servicePlan: mockServicePlans.find(p => p.id === customer.servicePlanId),
      olt: mockOLTs.find(o => o.id === customer.oltId),
      odc: mockODCs.find(o => o.id === customer.odcId),
      odp: mockODPs.find(o => o.id === customer.odpId),
    };
  }

  // Get customer statistics
  getCustomerStats(): CustomerStats {
    const total = this.customers.length;
    const active = this.customers.filter(c => c.status === 'active').length;
    const suspended = this.customers.filter(c => c.status === 'suspended').length;
    const inactive = this.customers.filter(c => c.status === 'inactive').length;
    const online = this.customers.filter(c => c.isOnline).length;
    const offline = this.customers.filter(c => !c.isOnline && c.status === 'active').length;

    return { total, active, suspended, inactive, online, offline };
  }

  // Get service plans
  getServicePlans(): ServicePlan[] {
    return mockServicePlans.filter(p => p.isActive);
  }

  // Create customer
  createCustomer(data: Partial<Customer>): Customer {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      customerCode: this.generateCustomerCode(),
      fullName: data.fullName || '',
      phone: data.phone || '',
      email: data.email,
      address: data.address || '',
      rt: data.rt,
      rw: data.rw,
      kelurahan: data.kelurahan,
      kecamatan: data.kecamatan,
      city: data.city,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      status: 'pending_activation',
      servicePlanId: data.servicePlanId || '',
      monthlyFee: data.monthlyFee || 0,
      outstandingBalance: 0,
      odpId: data.odpId,
      odcId: data.odcId,
      oltId: data.oltId,
      oltPort: data.oltPort,
      onuSerial: data.onuSerial,
      pppoeUsername: this.generatePPPoEUsername(data.fullName || ''),
      pppoePassword: this.generatePassword(),
      isOnline: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.customers.push(newCustomer);
    return newCustomer;
  }

  // Update customer
  updateCustomer(id: string, data: Partial<Customer>): Customer | undefined {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    this.customers[index] = {
      ...this.customers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return this.customers[index];
  }

  // Activate customer
  activateCustomer(id: string): Customer | undefined {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return undefined;

    const activationDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.updateCustomer(id, {
      status: 'active',
      activationDate,
      dueDate: dueDate.toISOString().split('T')[0],
    });
  }

  // Suspend customer
  suspendCustomer(id: string): Customer | undefined {
    return this.updateCustomer(id, {
      status: 'suspended',
      isOnline: false,
    });
  }

  // Unsuspend customer
  unsuspendCustomer(id: string): Customer | undefined {
    return this.updateCustomer(id, {
      status: 'active',
    });
  }

  // Change service plan
  changeServicePlan(id: string, newPlanId: string): Customer | undefined {
    const plan = mockServicePlans.find(p => p.id === newPlanId);
    if (!plan) return undefined;

    return this.updateCustomer(id, {
      servicePlanId: newPlanId,
      monthlyFee: plan.monthlyPrice,
    });
  }

  // Helper: Generate customer code
  private generateCustomerCode(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = this.customers.length + 1;
    return `CUST-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Helper: Generate PPPoE username
  private generatePPPoEUsername(fullName: string): string {
    return fullName.toLowerCase().replace(/\s+/g, '.');
  }

  // Helper: Generate password
  private generatePassword(): string {
    return Math.random().toString(36).slice(-8);
  }
}

export const customerService = new CustomerService();


// Legacy exports for backward compatibility with CustomerForm
export const addCustomer = (data: Omit<any, 'id'>) => {
  return customerService.createCustomer(data);
};

export const updateCustomer = (data: any) => {
  return customerService.updateCustomer(data.id, data);
};

export const deleteCustomer = (id: string) => {
  // In real app, call API to delete
  return true;
};

export const getPackages = () => {
  return mockServicePlans.map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.monthlyPrice,
    speed: `${plan.bandwidthDownload} Mbps`,
  }));
};

export const getPackageById = (id: string) => {
  const plan = mockServicePlans.find(p => p.id === id);
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name,
    price: plan.monthlyPrice,
    speed: `${plan.bandwidthDownload} Mbps`,
  };
};

// Also export for old imports
export const getCustomers = () => {
  return customerService.getCustomers();
};
