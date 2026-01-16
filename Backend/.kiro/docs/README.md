# RT/RW Net SaaS Backend - Documentation

Complete documentation for RT/RW Net SaaS Backend API.

---

## 📚 Documentation Structure

```
docs/
├── README.md (this file)
├── FRONTEND_API_DOCUMENTATION.md    ⭐ Main API reference
├── API_QUICK_REFERENCE.md           ⚡ Quick lookup
├── API_RESPONSE_STANDARD.md         📋 Response format
├── API_ERROR_CODES.md               🔴 Error codes
├── SIGNUP_API_STANDARD.md           📝 Sign up details
├── LANDING_BILLING_DASHBOARD.md     💳 Billing features
├── FREE_TRIAL_FEATURE.md            🎁 Trial system
├── FRONTEND_INTEGRATION.md          🔗 Integration guide
└── ...
```

---

## 🚀 Quick Start

### For Frontend Developers

**Start here:**
1. Read [../FRONTEND_UPDATE_SUMMARY.md](../FRONTEND_UPDATE_SUMMARY.md)
2. Check [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)
3. Reference [FRONTEND_API_DOCUMENTATION.md](FRONTEND_API_DOCUMENTATION.md)

**Key files:**
- `FRONTEND_API_DOCUMENTATION.md` - Complete API reference
- `API_QUICK_REFERENCE.md` - Quick examples
- `API_ERROR_CODES.md` - Error handling

---

## 📖 Main Documentation

### [FRONTEND_API_DOCUMENTATION.md](FRONTEND_API_DOCUMENTATION.md)

Complete API documentation including:
- All endpoints with examples
- TypeScript interfaces
- Request/response formats
- Error handling
- Helper functions
- Complete code examples

**This is your main reference!**

---

## ⚡ Quick Reference

### [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)

Quick lookup for:
- Common endpoints
- Code snippets
- Error codes
- Testing commands

**Use this for quick lookups!**

---

## 📋 Response Format

### [API_RESPONSE_STANDARD.md](API_RESPONSE_STANDARD.md)

Details about:
- Standard response format
- HTTP status codes
- Success/error structure
- Best practices

---

## 🔴 Error Codes

### [API_ERROR_CODES.md](API_ERROR_CODES.md)

Complete reference for:
- All error codes (AUTH_1001, VAL_2001, etc.)
- Error messages
- Validation rules
- Frontend handling examples

---

## 📝 Feature Documentation

### Sign Up & Registration

- [SIGNUP_API_STANDARD.md](SIGNUP_API_STANDARD.md) - Sign up endpoint
- [FREE_TRIAL_FEATURE.md](FREE_TRIAL_FEATURE.md) - Free trial system
- [SELF_SERVICE_FLOW.md](SELF_SERVICE_FLOW.md) - Self-service flow

### Billing & Dashboard

- [LANDING_BILLING_DASHBOARD.md](LANDING_BILLING_DASHBOARD.md) - Billing dashboard
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - Integration guide

### Authentication

- Simple login (email or subdomain)
- Standard login (with tenant_id)
- Token refresh
- User management

---

## 🔗 API Endpoints Summary

### Base URL
```
http://localhost:8089/api/v1
```

### Public Endpoints
```
GET  /public/plans          Get subscription plans
POST /public/signup         Sign up new tenant
```

### Authentication
```
POST /auth/simple-login     Login (email or subdomain)
POST /auth/login            Login (with tenant_id)
POST /auth/register         Register user
POST /auth/logout           Logout
POST /auth/refresh          Refresh token
GET  /auth/me               Get current user
```

### Billing (Auth Required)
```
GET  /billing               Get billing dashboard
PUT  /billing/subscription  Update subscription
PUT  /billing/settings      Update settings
POST /billing/cancel        Cancel subscription
PUT  /billing/payment-method Update payment
```

---

## 💡 Code Examples

### Login
```typescript
const response = await fetch('/api/v1/auth/simple-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin@myisp.com',
    password: 'password123'
  })
});

const data = await response.json();

if (data.success) {
  localStorage.setItem('access_token', data.data.access_token);
}
```

### Error Handling
```typescript
if (!data.success) {
  switch (data.error?.code) {
    case 'AUTH_1001':
      alert('Invalid credentials');
      break;
    case 'VAL_2001':
      // Show field errors
      Object.keys(data.error.details).forEach(field => {
        showFieldError(field, data.error.details[field]);
      });
      break;
    default:
      alert(data.error.message);
  }
}
```

---

## 🧪 Testing

### Test Files
- [../TEST_SIMPLE_LOGIN.md](../TEST_SIMPLE_LOGIN.md) - Login testing
- [../TEST_FREE_TRIAL.md](../TEST_FREE_TRIAL.md) - Trial testing
- [../TEST_BILLING_DASHBOARD.md](../TEST_BILLING_DASHBOARD.md) - Billing testing

### cURL Examples
```bash
# Get plans
curl http://localhost:8089/api/v1/public/plans

# Login
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@test.com","password":"test123"}'
```

---

## 📦 TypeScript Support

Complete TypeScript interfaces in [FRONTEND_API_DOCUMENTATION.md](FRONTEND_API_DOCUMENTATION.md):

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

---

## 🎯 Migration Guide

Migrating from old API format? See:
- [../FRONTEND_UPDATE_SUMMARY.md](../FRONTEND_UPDATE_SUMMARY.md)

Key changes:
- All responses now have `success` field
- Data wrapped in `data` field
- Errors wrapped in `error` object
- New error codes (AUTH_1001, VAL_2001, etc.)

---

## 📞 Support

- **Questions**: Check documentation first
- **Issues**: Create issue in repository
- **Updates**: Check change log

---

## 📝 Change Log

### v2.0.0 (Current)
- ✅ Standard response format
- ✅ Consistent error codes
- ✅ Field-specific validation
- ✅ Complete documentation

---

## 🔗 Related Files

Root directory:
- [../API_DOCUMENTATION_INDEX.md](../API_DOCUMENTATION_INDEX.md) - Documentation index
- [../FRONTEND_UPDATE_SUMMARY.md](../FRONTEND_UPDATE_SUMMARY.md) - Update summary
- [../STANDARD_RESPONSE_SUMMARY.md](../STANDARD_RESPONSE_SUMMARY.md) - Implementation details

---

**Happy coding!** 🚀
