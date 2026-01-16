# API Client Examples - Landing Page

Ready-to-use API client implementations untuk berbagai frontend frameworks.

---

## Table of Contents

1. [Vanilla JavaScript](#vanilla-javascript)
2. [React + Axios](#react--axios)
3. [React + Fetch](#react--fetch)
4. [Vue 3 Composition API](#vue-3-composition-api)
5. [Next.js API Routes](#nextjs-api-routes)
6. [Angular Service](#angular-service)

---

## Vanilla JavaScript

### api-client.js

```javascript
/**
 * Simple API Client for Landing Page
 */
class LandingApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'http://localhost:8089';
  }

  /**
   * Get available plans
   */
  async getPlans() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/public/plans`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  /**
   * Sign up new tenant
   */
  async signUp(data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/public/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }
}

// Usage
const api = new LandingApiClient('http://localhost:8089');

// Get plans
api.getPlans()
  .then(data => {
    console.log('Plans:', data.plans);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Sign up
api.signUp({
  isp_name: 'My ISP',
  subdomain: 'myisp',
  email: 'owner@myisp.com',
  password: 'secure123',
  phone: '08123456789',
  plan_id: 'plan-uuid',
  owner_name: 'John Doe',
  use_trial: true
})
  .then(response => {
    if (response.is_trial) {
      console.log('Trial started! Ends:', response.trial_ends);
    } else {
      console.log('Payment URL:', response.payment_url);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

## React + Axios

### api/landingApi.js

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8089';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || 'An error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server');
    } else {
      // Something else happened
      throw new Error(error.message);
    }
  }
);

/**
 * Get available plans
 */
export const getPlans = async () => {
  const response = await apiClient.get('/api/v1/public/plans');
  return response.data;
};

/**
 * Sign up new tenant
 */
export const signUp = async (data) => {
  const response = await apiClient.post('/api/v1/public/signup', data);
  return response.data;
};

export default {
  getPlans,
  signUp
};
```

### hooks/useApi.js

```javascript
import { useState, useCallback } from 'react';
import * as landingApi from '../api/landingApi';

/**
 * Custom hook for API calls
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};

/**
 * Hook for getting plans
 */
export const usePlans = () => {
  const [plans, setPlans] = useState([]);
  const { loading, error, execute } = useApi();

  const fetchPlans = useCallback(async () => {
    const data = await execute(landingApi.getPlans);
    setPlans(data.plans);
  }, [execute]);

  return { plans, loading, error, fetchPlans };
};

/**
 * Hook for sign up
 */
export const useSignUp = () => {
  const { loading, error, execute } = useApi();

  const signUp = useCallback(async (formData) => {
    return await execute(landingApi.signUp, formData);
  }, [execute]);

  return { signUp, loading, error };
};
```

### Usage in Component

```javascript
import React, { useEffect } from 'react';
import { usePlans, useSignUp } from '../hooks/useApi';

const PricingPage = () => {
  const { plans, loading, error, fetchPlans } = usePlans();
  const { signUp, loading: signUpLoading } = useSignUp();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSignUp = async (planId, isTrial) => {
    try {
      const response = await signUp({
        isp_name: 'My ISP',
        subdomain: 'myisp',
        email: 'owner@myisp.com',
        password: 'secure123',
        phone: '08123456789',
        plan_id: planId,
        owner_name: 'John Doe',
        use_trial: isTrial
      });

      if (response.is_trial) {
        // Redirect to dashboard
        window.location.href = `/dashboard?tenant_id=${response.tenant_id}`;
      } else {
        // Redirect to payment
        window.location.href = response.payment_url;
      }
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>Rp {plan.price.toLocaleString()}</p>
          <button onClick={() => handleSignUp(plan.id, true)}>
            Start Free Trial
          </button>
          <button onClick={() => handleSignUp(plan.id, false)}>
            Subscribe Now
          </button>
        </div>
      ))}
    </div>
  );
};

export default PricingPage;
```

---

## React + Fetch

### api/landingApi.js

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8089';

/**
 * Base fetch wrapper
 */
const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get available plans
 */
export const getPlans = () => {
  return fetchApi('/api/v1/public/plans');
};

/**
 * Sign up new tenant
 */
export const signUp = (data) => {
  return fetchApi('/api/v1/public/signup', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

---

## Vue 3 Composition API

### composables/useApi.js

```javascript
import { ref } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089';

/**
 * Base API composable
 */
export const useApi = () => {
  const loading = ref(false);
  const error = ref(null);

  const fetchApi = async (endpoint, options = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, fetchApi };
};

/**
 * Plans composable
 */
export const usePlans = () => {
  const plans = ref([]);
  const { loading, error, fetchApi } = useApi();

  const fetchPlans = async () => {
    const data = await fetchApi('/api/v1/public/plans');
    plans.value = data.plans;
  };

  return { plans, loading, error, fetchPlans };
};

/**
 * Sign up composable
 */
export const useSignUp = () => {
  const { loading, error, fetchApi } = useApi();

  const signUp = async (formData) => {
    return await fetchApi('/api/v1/public/signup', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  };

  return { signUp, loading, error };
};
```

### Usage in Component

```vue
<script setup>
import { onMounted } from 'vue';
import { usePlans, useSignUp } from '@/composables/useApi';

const { plans, loading, error, fetchPlans } = usePlans();
const { signUp, loading: signUpLoading } = useSignUp();

onMounted(() => {
  fetchPlans();
});

const handleSignUp = async (planId, isTrial) => {
  try {
    const response = await signUp({
      isp_name: 'My ISP',
      subdomain: 'myisp',
      email: 'owner@myisp.com',
      password: 'secure123',
      phone: '08123456789',
      plan_id: planId,
      owner_name: 'John Doe',
      use_trial: isTrial
    });

    if (response.is_trial) {
      window.location.href = `/dashboard?tenant_id=${response.tenant_id}`;
    } else {
      window.location.href = response.payment_url;
    }
  } catch (error) {
    alert(error.message);
  }
};
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <div v-for="plan in plans" :key="plan.id">
      <h3>{{ plan.name }}</h3>
      <p>Rp {{ plan.price.toLocaleString() }}</p>
      <button @click="handleSignUp(plan.id, true)">
        Start Free Trial
      </button>
      <button @click="handleSignUp(plan.id, false)">
        Subscribe Now
      </button>
    </div>
  </div>
</template>
```

---

## Next.js API Routes

### pages/api/plans.ts

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8089';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/plans`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}
```

### pages/api/signup.ts

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8089';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}
```

### lib/api.ts (Client-side)

```typescript
/**
 * Client-side API calls (goes through Next.js API routes)
 */

export const getPlans = async () => {
  const response = await fetch('/api/plans');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch plans');
  }

  return data;
};

export const signUp = async (formData: any) => {
  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
};
```

---

## Angular Service

### services/landing-api.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_customers: number;
  max_users: number;
  is_active: boolean;
}

export interface GetPlansResponse {
  plans: Plan[];
}

export interface SignUpRequest {
  isp_name: string;
  subdomain: string;
  email: string;
  password: string;
  phone: string;
  plan_id: string;
  owner_name: string;
  use_trial: boolean;
}

export interface SignUpResponse {
  tenant_id: string;
  user_id: string;
  is_trial: boolean;
  trial_ends?: string;
  order_id?: string;
  amount?: number;
  payment_url?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LandingApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get available plans
   */
  getPlans(): Observable<Plan[]> {
    return this.http
      .get<GetPlansResponse>(`${this.apiUrl}/api/v1/public/plans`)
      .pipe(
        map(response => response.plans),
        catchError(this.handleError)
      );
  }

  /**
   * Sign up new tenant
   */
  signUp(data: SignUpRequest): Observable<SignUpResponse> {
    return this.http
      .post<SignUpResponse>(`${this.apiUrl}/api/v1/public/signup`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.error || error.message;
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

### Usage in Component

```typescript
import { Component, OnInit } from '@angular/core';
import { LandingApiService, Plan, SignUpRequest } from './services/landing-api.service';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html'
})
export class PricingComponent implements OnInit {
  plans: Plan[] = [];
  loading = false;
  error: string | null = null;

  constructor(private apiService: LandingApiService) {}

  ngOnInit() {
    this.fetchPlans();
  }

  fetchPlans() {
    this.loading = true;
    this.error = null;

    this.apiService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
      }
    });
  }

  handleSignUp(planId: string, isTrial: boolean) {
    const signUpData: SignUpRequest = {
      isp_name: 'My ISP',
      subdomain: 'myisp',
      email: 'owner@myisp.com',
      password: 'secure123',
      phone: '08123456789',
      plan_id: planId,
      owner_name: 'John Doe',
      use_trial: isTrial
    };

    this.apiService.signUp(signUpData).subscribe({
      next: (response) => {
        if (response.is_trial) {
          window.location.href = `/dashboard?tenant_id=${response.tenant_id}`;
        } else {
          window.location.href = response.payment_url!;
        }
      },
      error: (error) => {
        alert(error.message);
      }
    });
  }
}
```

---

## Environment Variables

### React (.env)
```env
REACT_APP_API_URL=http://localhost:8089
REACT_APP_DASHBOARD_URL=https://dashboard.yourdomain.com
```

### Vue (.env)
```env
VITE_API_URL=http://localhost:8089
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

### Next.js (.env.local)
```env
API_BASE_URL=http://localhost:8089
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
```

### Angular (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8089',
  dashboardUrl: 'https://dashboard.yourdomain.com'
};
```

---

## Summary

Pilih API client sesuai framework Anda:

- **Vanilla JS** - Simple, no dependencies
- **React + Axios** - Popular, feature-rich
- **React + Fetch** - Native, lightweight
- **Vue 3** - Composition API, reactive
- **Next.js** - Server-side proxy, secure
- **Angular** - RxJS, type-safe

Semua implementation sudah include:
- ✅ Error handling
- ✅ Loading states
- ✅ TypeScript support (where applicable)
- ✅ Environment variables
- ✅ Ready to use

Copy & paste sesuai kebutuhan! 🚀
