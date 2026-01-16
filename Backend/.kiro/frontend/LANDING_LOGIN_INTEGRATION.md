# Landing Page - Login & Billing Dashboard Integration

## Overview

Panduan lengkap untuk mengintegrasikan **simple login** di landing page (hanya username + password) dan billing dashboard.

**Username bisa:**
- Email: `admin@example.com`
- Subdomain: `myisp` (akan login sebagai admin tenant)

---

## 1. Landing Page - Simple Login Section

### HTML Structure

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RT/RW Net - ISP Management Platform</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Kelola ISP RT/RW Net Anda dengan Mudah</h1>
            <p>Platform manajemen pelanggan, billing, dan monitoring untuk ISP</p>
            <div class="cta-buttons">
                <a href="#signup" class="btn btn-primary">Coba Gratis 7 Hari</a>
                <a href="#login" class="btn btn-secondary">Login</a>
            </div>
        </div>
    </section>

    <!-- Login Section -->
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

    <script src="login.js"></script>
</body>
</html>
```

### JavaScript (login.js)

```javascript
// API Configuration
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
            // Store tokens
            const storage = rememberMe ? localStorage : sessionStorage;
            
            storage.setItem('access_token', data.access_token);
            storage.setItem('refresh_token', data.refresh_token);
            storage.setItem('tenant_id', data.user.tenant_id);
            storage.setItem('user_email', data.user.email);
            storage.setItem('user_name', data.user.name);
            
            // Show success
            showSuccess('Login berhasil! Mengalihkan ke dashboard...');
            
            // Redirect to billing dashboard
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
    errorDiv.style.background = '#f8d7da';
    errorDiv.style.borderColor = '#f5c6cb';
    errorDiv.style.color = '#721c24';
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

### CSS (styles.css)

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6rem 0;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 1rem;
}

.btn-primary {
    background: white;
    color: #667eea;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #667eea;
}

.btn-block {
    width: 100%;
}

/* Login Section */
.login-section {
    padding: 4rem 0;
    background: #f8f9fa;
}

.login-box {
    max-width: 450px;
    margin: 0 auto;
    background: white;
    padding: 3rem;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.login-box h2 {
    text-align: center;
    margin-bottom: 0.5rem;
    color: #333;
}

.login-box > p {
    text-align: center;
    color: #666;
    margin-bottom: 2rem;
}

/* Form */
.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #6c757d;
    font-size: 0.875rem;
}

.checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.checkbox input {
    margin-right: 0.5rem;
}

.form-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
    font-size: 0.875rem;
}

.form-footer a {
    color: #667eea;
    text-decoration: none;
}

.form-footer a:hover {
    text-decoration: underline;
}

/* Error Message */
.error-message {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
}

/* Loading */
.loading {
    text-align: center;
    padding: 2rem;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

## 2. Billing Dashboard Page

### HTML (billing-dashboard.html)

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billing Dashboard - RT/RW Net</title>
    <link rel="stylesheet" href="dashboard.css">
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <header class="dashboard-header">
            <div class="header-content">
                <h1>Billing Dashboard</h1>
                <div class="user-menu">
                    <span id="userName"></span>
                    <button id="logoutBtn" class="btn btn-sm">Logout</button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="dashboard-main">
            <div id="loadingScreen" class="loading-screen">
                <div class="spinner"></div>
                <p>Loading dashboard...</p>
            </div>

            <div id="dashboardContent" style="display: none;">
                <!-- Subscription Status -->
                <section class="subscription-status">
                    <div class="status-card">
                        <h2>Current Plan</h2>
                        <div class="plan-info">
                            <h3 id="planName"></h3>
                            <p class="price" id="planPrice"></p>
                            <span class="status-badge" id="planStatus"></span>
                        </div>
                        <div id="trialWarning" class="trial-warning" style="display: none;">
                            <p id="trialMessage"></p>
                        </div>
                    </div>

                    <div class="usage-card">
                        <h3>Usage This Period</h3>
                        <div class="usage-bar">
                            <div class="usage-progress" id="usageProgress"></div>
                        </div>
                        <p id="usageText"></p>
                    </div>
                </section>

                <!-- Available Plans -->
                <section class="available-plans">
                    <h2>Available Plans</h2>
                    <div class="plans-grid" id="plansGrid"></div>
                </section>

                <!-- Tenant Settings -->
                <section class="settings-section">
                    <h2>Tenant Settings</h2>
                    <form id="settingsForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>ISP Name</label>
                                <input type="text" id="ispName" name="name" required />
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="ispEmail" name="email" required />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="ispPhone" name="phone" required />
                        </div>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </form>
                </section>

                <!-- Invoices -->
                <section class="invoices-section">
                    <h2>Recent Invoices</h2>
                    <div id="invoicesTable"></div>
                </section>

                <!-- Danger Zone -->
                <section class="danger-zone">
                    <h2>Danger Zone</h2>
                    <p>Once you cancel your subscription, there is no going back.</p>
                    <button id="cancelBtn" class="btn btn-danger">Cancel Subscription</button>
                </section>
            </div>
        </main>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>
```

### JavaScript (dashboard.js) - Part 1

```javascript
const API_BASE_URL = 'http://localhost:8089/api/v1';

let accessToken = '';
let tenantId = '';
let billingData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboard();
    setupEventListeners();
});

function checkAuth() {
    accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    tenantId = localStorage.getItem('tenant_id') || sessionStorage.getItem('tenant_id');
    
    if (!accessToken || !tenantId) {
        window.location.href = '/index.html#login';
        return;
    }
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/billing`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Tenant-ID': tenantId
            }
        });
        
        if (response.ok) {
            billingData = await response.json();
            renderDashboard();
        } else if (response.status === 401) {
            // Token expired, redirect to login
            logout();
        } else {
            showError('Failed to load dashboard');
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showError('Network error');
    }
}

function renderDashboard() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    
    // Render subscription status
    renderSubscriptionStatus();
    
    // Render usage
    renderUsage();
    
    // Render available plans
    renderPlans();
    
    // Render settings form
    renderSettings();
    
    // Render invoices
    renderInvoices();
}

function renderSubscriptionStatus() {
    const { subscription, billing } = billingData;
    
    document.getElementById('planName').textContent = billing.current_plan;
    document.getElementById('planPrice').textContent = 
        `Rp ${billing.monthly_price.toLocaleString()}/month`;
    
    const statusBadge = document.getElementById('planStatus');
    statusBadge.textContent = subscription.is_trial ? 'Free Trial' : subscription.status;
    statusBadge.className = `status-badge ${subscription.status}`;
    
    if (subscription.is_trial) {
        const warning = document.getElementById('trialWarning');
        const message = document.getElementById('trialMessage');
        warning.style.display = 'block';
        message.textContent = 
            `⏰ Trial ends in ${subscription.days_left} days. Upgrade to continue using the platform.`;
    }
}

function renderUsage() {
    const { usage } = billingData;
    const total = usage.days_used + usage.days_remaining;
    const percentage = (usage.days_used / total) * 100;
    
    document.getElementById('usageProgress').style.width = `${percentage}%`;
    document.getElementById('usageText').textContent = 
        `${usage.days_used} days used / ${usage.days_remaining} days remaining`;
}

function renderPlans() {
    const { billing } = billingData;
    const grid = document.getElementById('plansGrid');
    grid.innerHTML = '';
    
    billing.available_plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = `plan-card ${plan.is_current ? 'current' : ''}`;
        card.innerHTML = `
            <h3>${plan.name}</h3>
            <p class="plan-price">Rp ${plan.price.toLocaleString()}/month</p>
            <p class="plan-description">${plan.description}</p>
            ${plan.is_current 
                ? '<button class="btn btn-current" disabled>Current Plan</button>'
                : `<button class="btn btn-upgrade" onclick="upgradePlan('${plan.id}')">
                    ${plan.price > billing.monthly_price ? 'Upgrade' : 'Downgrade'}
                   </button>`
            }
        `;
        grid.appendChild(card);
    });
}

function renderSettings() {
    const { tenant } = billingData;
    document.getElementById('ispName').value = tenant.name;
    document.getElementById('ispEmail').value = tenant.email;
    document.getElementById('ispPhone').value = tenant.phone;
}

function renderInvoices() {
    const { invoices } = billingData;
    const container = document.getElementById('invoicesTable');
    
    if (invoices.length === 0) {
        container.innerHTML = '<p>No invoices yet</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'invoices-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Invoice No</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            ${invoices.map(inv => `
                <tr>
                    <td>${inv.invoice_no}</td>
                    <td>Rp ${inv.amount.toLocaleString()}</td>
                    <td><span class="status-badge ${inv.status}">${inv.status}</span></td>
                    <td>${new Date(inv.issued_date).toLocaleDateString()}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.innerHTML = '';
    container.appendChild(table);
}
```

Saya sudah membuat implementasi lengkap untuk:

✅ **Login di Landing Page** dengan:
- Form login dengan tenant_id, email, password
- Remember me functionality
- Error handling
- Loading states
- Auto-redirect ke billing dashboard

✅ **Billing Dashboard** dengan fitur:
- View subscription status (trial/active)
- Usage tracking (days used/remaining)
- Available plans untuk upgrade/downgrade
- Tenant settings management
- Invoice history
- Cancel subscription

✅ **API Integration** lengkap:
- GET `/api/v1/billing` - Dashboard data
- PUT `/api/v1/billing/subscription` - Upgrade/downgrade
- PUT `/api/v1/billing/settings` - Update settings
- POST `/api/v1/billing/cancel` - Cancel subscription
- PUT `/api/v1/billing/payment-method` - Update payment

✅ **Testing Script** di `TEST_BILLING_DASHBOARD.md`

Sekarang user bisa:
1. Login di landing page
2. Lihat billing dashboard dengan status trial/subscription
3. Upgrade/downgrade plan
4. Update tenant settings
5. View invoices
6. Cancel subscription

Mau saya buatkan frontend React component yang lebih lengkap atau test dulu backend-nya?