# Auto Redirect for Logged In Users

## Overview

Implementasi auto-redirect untuk user yang sudah login. Jika user sudah login dan mencoba akses halaman login/register, akan otomatis redirect ke dashboard.

## Features Implemented

### 1. Login Page Auto-Redirect

**File:** `src/pages/Login.tsx`

**Logic:**
```typescript
useEffect(() => {
  const accessToken = sessionStorage.getItem('access_token');
  if (accessToken) {
    // Already logged in, redirect to dashboard
    navigate('/dashboard');
  }
}, [navigate]);
```

**Behavior:**
- Check `access_token` di sessionStorage saat component mount
- Jika ada token → redirect ke `/dashboard`
- Jika tidak ada → tampilkan form login

---

### 2. Register Page Auto-Redirect

**File:** `src/pages/Register.tsx`

**Logic:**
```typescript
useEffect(() => {
  const accessToken = sessionStorage.getItem('access_token');
  if (accessToken) {
    // Already logged in, redirect to dashboard
    navigate('/dashboard');
  }
}, [navigate]);
```

**Behavior:**
- Check `access_token` di sessionStorage saat component mount
- Jika ada token → redirect ke `/dashboard`
- Jika tidak ada → tampilkan form register

---

### 3. Navbar Dynamic Button

**File:** `src/components/Navbar.tsx`

**Logic:**
```typescript
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  // Check if user is logged in
  const accessToken = sessionStorage.getItem('access_token');
  setIsLoggedIn(!!accessToken);
}, []);
```

**Behavior:**
- Check login status saat component mount
- Jika logged in → tampilkan button "Dashboard"
- Jika tidak logged in → tampilkan button "Masuk" & "Coba Gratis"

**Desktop View:**
```typescript
{isLoggedIn ? (
  <Button variant="hero" size="sm" asChild>
    <Link to="/dashboard">Dashboard</Link>
  </Button>
) : (
  <>
    <Button variant="ghost" size="sm" asChild>
      <Link to="/login">Masuk</Link>
    </Button>
    <Button variant="hero" size="sm" asChild>
      <Link to="/register">Coba Gratis</Link>
    </Button>
  </>
)}
```

**Mobile View:**
```typescript
{isLoggedIn ? (
  <Button variant="hero" size="sm" asChild>
    <Link to="/dashboard">Dashboard</Link>
  </Button>
) : (
  <>
    <Button variant="ghost" size="sm" asChild>
      <Link to="/login">Masuk</Link>
    </Button>
    <Button variant="hero" size="sm" asChild>
      <Link to="/register">Coba Gratis</Link>
    </Button>
  </>
)}
```

---

## User Flows

### Flow 1: User Belum Login

```
1. User buka homepage
   ↓
2. Navbar shows: [Masuk] [Coba Gratis]
   ↓
3. User click "Masuk"
   ↓
4. Redirect to /login
   ↓
5. Show login form
```

### Flow 2: User Sudah Login

```
1. User buka homepage
   ↓
2. Navbar shows: [Dashboard]
   ↓
3. User click "Dashboard"
   ↓
4. Redirect to /dashboard
   ↓
5. Show billing dashboard
```

### Flow 3: User Sudah Login, Coba Akses Login

```
1. User sudah login (ada token)
   ↓
2. User coba akses /login
   ↓
3. useEffect check token
   ↓
4. Token found → auto redirect to /dashboard
   ↓
5. User tidak bisa lihat form login
```

### Flow 4: User Sudah Login, Coba Akses Register

```
1. User sudah login (ada token)
   ↓
2. User coba akses /register
   ↓
3. useEffect check token
   ↓
4. Token found → auto redirect to /dashboard
   ↓
5. User tidak bisa lihat form register
```

---

## Session Check

### What is Checked

```typescript
const accessToken = sessionStorage.getItem('access_token');
```

**Stored after login:**
```typescript
sessionStorage.setItem('access_token', data.access_token);
sessionStorage.setItem('refresh_token', data.refresh_token);
sessionStorage.setItem('tenant_id', data.user.tenant_id);
sessionStorage.setItem('user_email', data.user.email);
sessionStorage.setItem('user_name', data.user.name);
```

**Cleared on logout:**
```typescript
sessionStorage.clear();
```

---

## Benefits

### 1. Better UX
- User tidak perlu login lagi jika sudah login
- Langsung ke dashboard jika sudah authenticated
- Tidak bingung dengan form login/register

### 2. Security
- Prevent duplicate login
- Consistent authentication state
- Clear session management

### 3. Navigation
- Navbar shows relevant buttons
- Easy access to dashboard
- Clear visual feedback

---

## Testing

### Test Auto-Redirect Login

1. **Login first:**
   ```
   Go to /login
   Enter credentials
   Submit
   → Redirected to /dashboard
   ```

2. **Try access login again:**
   ```
   Go to /login
   → Immediately redirected to /dashboard
   → Cannot see login form
   ```

### Test Auto-Redirect Register

1. **Login first:**
   ```
   Go to /login
   Enter credentials
   Submit
   → Redirected to /dashboard
   ```

2. **Try access register:**
   ```
   Go to /register
   → Immediately redirected to /dashboard
   → Cannot see register form
   ```

### Test Navbar Button

1. **Before login:**
   ```
   Open homepage
   Navbar shows: [Masuk] [Coba Gratis]
   ```

2. **After login:**
   ```
   Login
   Go back to homepage
   Navbar shows: [Dashboard]
   ```

3. **After logout:**
   ```
   Logout from dashboard
   Go to homepage
   Navbar shows: [Masuk] [Coba Gratis]
   ```

---

## Edge Cases

### Case 1: Token Expired

**Current Behavior:**
- Token still in sessionStorage
- Auto-redirect to dashboard
- Dashboard API call fails
- Show error message

**Future Enhancement:**
- Validate token before redirect
- Clear expired token
- Redirect to login

### Case 2: Invalid Token

**Current Behavior:**
- Token in sessionStorage
- Auto-redirect to dashboard
- Dashboard API call fails (401)
- Show error message

**Future Enhancement:**
- Validate token format
- Clear invalid token
- Redirect to login

### Case 3: Manual URL Access

**Scenario:**
```
User types /login in address bar while logged in
```

**Behavior:**
- Page loads
- useEffect runs
- Check token
- Auto-redirect to /dashboard
- User never sees login form

---

## Implementation Details

### Dependencies

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
```

### Pattern

```typescript
// In component
useEffect(() => {
  const accessToken = sessionStorage.getItem('access_token');
  if (accessToken) {
    navigate('/dashboard');
  }
}, [navigate]);
```

### Why useEffect?

- Runs after component mount
- Check happens client-side
- No flash of login form
- Clean redirect

### Why sessionStorage?

- Cleared on browser close
- More secure than localStorage
- Appropriate for auth tokens
- Easy to clear on logout

---

## Files Modified

1. **`src/pages/Login.tsx`**
   - Added useEffect for auto-redirect
   - Import useEffect

2. **`src/pages/Register.tsx`**
   - Added useEffect for auto-redirect
   - Import useEffect

3. **`src/components/Navbar.tsx`**
   - Added isLoggedIn state
   - Added useEffect to check login status
   - Conditional rendering for buttons
   - Import useEffect

---

## Future Enhancements

### 1. Token Validation

```typescript
const isTokenValid = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

useEffect(() => {
  const accessToken = sessionStorage.getItem('access_token');
  if (accessToken && isTokenValid(accessToken)) {
    navigate('/dashboard');
  } else if (accessToken) {
    // Token expired, clear it
    sessionStorage.clear();
  }
}, [navigate]);
```

### 2. Auth Context

```typescript
// Create AuthContext
const AuthContext = createContext();

// Provider
const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

// Use in components
const { isLoggedIn } = useContext(AuthContext);
```

### 3. Protected Routes

```typescript
const ProtectedRoute = ({ children }) => {
  const accessToken = sessionStorage.getItem('access_token');
  
  if (!accessToken) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## Summary

**Auto-Redirect:**
- ✅ Login page → redirect if logged in
- ✅ Register page → redirect if logged in
- ✅ Navbar → show Dashboard button if logged in

**Benefits:**
- Better UX
- Consistent auth state
- Clear navigation

**Testing:**
- Login → try access /login → auto redirect
- Login → try access /register → auto redirect
- Login → navbar shows Dashboard button
- Logout → navbar shows Masuk & Coba Gratis

**Ready to use!** 🚀
