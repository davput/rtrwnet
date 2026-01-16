# Test Simple Login (Username + Password Only)

## Overview

Test login sederhana di landing page dengan hanya username dan password.
Username bisa berupa:
- **Email** - email user yang terdaftar
- **Subdomain** - subdomain tenant (akan login sebagai admin)

---

## Quick Test Script

```powershell
Write-Host "=== Simple Login Test ===" -ForegroundColor Cyan

# 1. Get plans
Write-Host "`n1. Getting plans..." -ForegroundColor Yellow
$plans = curl http://localhost:8089/api/v1/public/plans | ConvertFrom-Json
$plan = $plans.plans | Where-Object { $_.slug -eq "standard" }

# 2. Sign up with trial
Write-Host "`n2. Signing up..." -ForegroundColor Yellow
$signup = curl -X POST http://localhost:8089/api/v1/public/signup `
  -H "Content-Type: application/json" `
  -d "{`"isp_name`":`"Simple Login ISP`",`"subdomain`":`"simplelogin`",`"email`":`"admin@simplelogin.com`",`"password`":`"simple123`",`"phone`":`"08555555555`",`"plan_id`":`"$($plan.id)`",`"owner_name`":`"Simple Owner`",`"use_trial`":true}" | ConvertFrom-Json

Write-Host "✓ Tenant: $($signup.tenant_id)" -ForegroundColor Green
Write-Host "✓ Email: admin@simplelogin.com" -ForegroundColor Green
Write-Host "✓ Subdomain: simplelogin" -ForegroundColor Green

# 3. Test login with EMAIL
Write-Host "`n3. Testing login with EMAIL..." -ForegroundColor Yellow
$loginEmail = curl -X POST http://localhost:8089/api/v1/auth/simple-login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin@simplelogin.com","password":"simple123"}' | ConvertFrom-Json

Write-Host "✓ Login with email successful!" -ForegroundColor Green
Write-Host "  User: $($loginEmail.user.name)" -ForegroundColor Cyan
Write-Host "  Email: $($loginEmail.user.email)" -ForegroundColor Cyan
Write-Host "  Tenant: $($loginEmail.user.tenant_id)" -ForegroundColor Cyan

# 4. Test login with SUBDOMAIN
Write-Host "`n4. Testing login with SUBDOMAIN..." -ForegroundColor Yellow
$loginSubdomain = curl -X POST http://localhost:8089/api/v1/auth/simple-login `
  -H "Content-Type: application/json" `
  -d '{"username":"simplelogin","password":"simple123"}' | ConvertFrom-Json

Write-Host "✓ Login with subdomain successful!" -ForegroundColor Green
Write-Host "  User: $($loginSubdomain.user.name)" -ForegroundColor Cyan
Write-Host "  Email: $($loginSubdomain.user.email)" -ForegroundColor Cyan
Write-Host "  Tenant: $($loginSubdomain.user.tenant_id)" -ForegroundColor Cyan

# 5. Test access to billing dashboard
Write-Host "`n5. Testing billing dashboard access..." -ForegroundColor Yellow
$billing = curl -X GET http://localhost:8089/api/v1/billing `
  -H "Authorization: Bearer $($loginEmail.access_token)" `
  -H "X-Tenant-ID: $($loginEmail.user.tenant_id)" | ConvertFrom-Json

Write-Host "✓ Billing dashboard loaded!" -ForegroundColor Green
Write-Host "  Plan: $($billing.billing.current_plan)" -ForegroundColor Cyan
Write-Host "  Status: $($billing.subscription.status)" -ForegroundColor Cyan
Write-Host "  Days Left: $($billing.subscription.days_left)" -ForegroundColor Cyan

Write-Host "`n=== Test Complete! ===" -ForegroundColor Green
Write-Host "Both login methods work:" -ForegroundColor White
Write-Host "  ✓ Login with email: admin@simplelogin.com" -ForegroundColor Green
Write-Host "  ✓ Login with subdomain: simplelogin" -ForegroundColor Green
```

---

## API Endpoint

### Simple Login

```
POST /api/v1/auth/simple-login
```

**Request:**
```json
{
  "username": "admin@example.com",  // or "subdomain"
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900,
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "admin",
    "tenant_id": "tenant-uuid"
  },
  "tenant": {
    "id": "tenant-uuid",
    "name": "ISP Name",
    "subdomain": "subdomain"
  }
}
```

---

## Step by Step Testing

### Test 1: Login with Email

```powershell
# Sign up first
$plans = curl http://localhost:8089/api/v1/public/plans | ConvertFrom-Json
$plan = $plans.plans[0]

$signup = curl -X POST http://localhost:8089/api/v1/public/signup `
  -H "Content-Type: application/json" `
  -d "{`"isp_name`":`"Test ISP`",`"subdomain`":`"testisp`",`"email`":`"admin@testisp.com`",`"password`":`"test123`",`"phone`":`"08123456789`",`"plan_id`":`"$($plan.id)`",`"owner_name`":`"Test Owner`",`"use_trial`":true}" | ConvertFrom-Json

# Login with email
$login = curl -X POST http://localhost:8089/api/v1/auth/simple-login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin@testisp.com","password":"test123"}' | ConvertFrom-Json

Write-Host "Login successful!"
Write-Host "Access Token: $($login.access_token.Substring(0,30))..."
Write-Host "User: $($login.user.name)"
Write-Host "Tenant: $($login.user.tenant_id)"
```

### Test 2: Login with Subdomain

```powershell
# Login with subdomain (will login as admin user)
$login = curl -X POST http://localhost:8089/api/v1/auth/simple-login `
  -H "Content-Type: application/json" `
  -d '{"username":"testisp","password":"test123"}' | ConvertFrom-Json

Write-Host "Login successful!"
Write-Host "Access Token: $($login.access_token.Substring(0,30))..."
Write-Host "User: $($login.user.name)"
Write-Host "Email: $($login.user.email)"
```

### Test 3: Access Billing Dashboard

```powershell
# Get billing dashboard
$billing = curl -X GET http://localhost:8089/api/v1/billing `
  -H "Authorization: Bearer $($login.access_token)" `
  -H "X-Tenant-ID: $($login.user.tenant_id)" | ConvertFrom-Json

Write-Host "Billing Dashboard:"
Write-Host "  Tenant: $($billing.tenant.name)"
Write-Host "  Plan: $($billing.billing.current_plan)"
Write-Host "  Status: $($billing.subscription.status)"
Write-Host "  Days Left: $($billing.subscription.days_left)"
```

---

## Frontend Implementation

### Updated Login Form (HTML)

```html
<section id="login" class="login-section">
    <div class="container">
        <div class="login-box">
            <h2>Login ke Dashboard</h2>
            <p>Masuk dengan email atau subdomain Anda</p>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Email atau Subdomain</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username"
                        placeholder="admin@isp.com atau subdomain"
                        required 
                    />
                    <small>Gunakan email atau subdomain tenant Anda</small>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password"
                        placeholder="••••••••"
                        required 
                    />
                </div>

                <div class="form-group">
                    <label class="checkbox">
                        <input type="checkbox" id="rememberMe" />
                        <span>Ingat saya</span>
                    </label>
                </div>

                <button type="submit" class="btn btn-primary btn-block">
                    Login
                </button>

                <div class="form-footer">
                    <a href="#forgot-password">Lupa password?</a>
                    <a href="#signup">Belum punya akun?</a>
                </div>
            </form>

            <div id="loginError" class="error-message" style="display: none;"></div>
            <div id="loginLoading" class="loading" style="display: none;">
                <div class="spinner"></div>
                <p>Logging in...</p>
            </div>
        </div>
    </div>
</section>
```

### Updated JavaScript (login.js)

```javascript
const API_BASE_URL = 'http://localhost:8089/api/v1';

// Simple Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/simple-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens and user info
            const storage = rememberMe ? localStorage : sessionStorage;
            
            storage.setItem('access_token', data.access_token);
            storage.setItem('refresh_token', data.refresh_token);
            storage.setItem('tenant_id', data.user.tenant_id);
            storage.setItem('user_email', data.user.email);
            storage.setItem('user_name', data.user.name);
            
            // Show success message
            showSuccess('Login berhasil! Mengalihkan ke dashboard...');
            
            // Redirect to billing dashboard after 1 second
            setTimeout(() => {
                window.location.href = '/billing-dashboard.html';
            }, 1000);
        } else {
            // Show error
            showError(data.message || 'Login gagal. Periksa username dan password Anda.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
        showLoading(false);
    }
});

function showLoading(show) {
    const loading = document.getElementById('loginLoading');
    const form = document.getElementById('loginForm');
    
    if (show) {
        loading.style.display = 'block';
        form.style.opacity = '0.5';
        form.style.pointerEvents = 'none';
    } else {
        loading.style.display = 'none';
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('loginError');
    errorDiv.style.display = 'none';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#d4edda';
    errorDiv.style.borderColor = '#c3e6cb';
    errorDiv.style.color = '#155724';
}
```

---

## Error Handling

### Invalid Credentials

**Request:**
```json
{
  "username": "wrong@email.com",
  "password": "wrongpass"
}
```

**Response (401):**
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "status": 401
}
```

### Inactive Tenant

**Response (403):**
```json
{
  "code": "TENANT_INACTIVE",
  "message": "Tenant is inactive",
  "status": 403
}
```

### Inactive User

**Response (403):**
```json
{
  "code": "USER_INACTIVE",
  "message": "User account is inactive",
  "status": 403
}
```

---

## Comparison: Old vs New Login

### Old Login (3 fields)
```json
{
  "tenant_id": "uuid-required",
  "email": "admin@example.com",
  "password": "password123"
}
```

### New Simple Login (2 fields)
```json
{
  "username": "admin@example.com",  // or "subdomain"
  "password": "password123"
}
```

---

## Benefits

✅ **Lebih sederhana** - User tidak perlu tahu tenant_id
✅ **Fleksibel** - Bisa login dengan email atau subdomain
✅ **User-friendly** - Seperti login pada umumnya
✅ **Backward compatible** - Login lama masih bisa digunakan

---

## Summary

**Endpoint baru:** `POST /api/v1/auth/simple-login`

**Username bisa:**
- Email: `admin@example.com`
- Subdomain: `myisp` (akan login sebagai admin)

**Response sama** dengan login biasa, termasuk access_token dan user info.

**Ready to use!** 🚀
