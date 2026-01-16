# Error Handling - Registration

## Overview

Implementasi error handling yang lebih detail untuk menampilkan pesan error dari backend dengan jelas kepada user.

## Backend Error Format

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "TENANT_3004",
    "message": "Subdomain is already taken",
    "details": {
      "subdomain": "The subdomain 'agus' is already in use. Please choose another one."
    }
  }
}
```

### Error Structure

- `success`: boolean - Always false for errors
- `error.code`: string - Error code (e.g., TENANT_3004)
- `error.message`: string - General error message
- `error.details`: object - Field-specific error messages

---

## Frontend Implementation

### API Layer (`src/lib/api.ts`)

**Enhanced Error Handling:**

```typescript
if (!response.ok) {
  // Create error object with detailed information
  const error: any = new Error(result.message || result.error || 'Registration failed');
  
  // Attach additional error details if available
  if (result.details) {
    error.details = result.details;
  }
  
  if (result.code) {
    error.code = result.code;
  }
  
  throw error;
}
```

**What it does:**
1. Create Error with main message
2. Attach `details` object if available
3. Attach error `code` if available
4. Throw enhanced error

---

### Register Page (`src/pages/Register.tsx`)

**Enhanced Error Display:**

```typescript
catch (error: any) {
  // Extract detailed error message from backend response
  let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
  
  if (error.message) {
    errorMessage = error.message;
  }
  
  // Check if there are detailed error messages in the response
  if (error.details) {
    // If details is an object with field-specific errors
    const detailMessages = Object.values(error.details).filter(Boolean);
    if (detailMessages.length > 0) {
      errorMessage = detailMessages.join(". ");
    }
  }
  
  toast({
    title: "Registrasi Gagal",
    description: errorMessage,
    variant: "destructive",
  });
}
```

**What it does:**
1. Start with default error message
2. Use `error.message` if available
3. Check for `error.details`
4. Extract all detail messages
5. Join multiple messages with ". "
6. Display in toast notification

---

## Error Examples

### Example 1: Subdomain Already Taken

**Backend Response:**
```json
{
  "success": false,
  "error": {
    "code": "TENANT_3004",
    "message": "Subdomain is already taken",
    "details": {
      "subdomain": "The subdomain 'agus' is already in use. Please choose another one."
    }
  }
}
```

**Frontend Display:**
```
Title: Registrasi Gagal
Description: The subdomain 'agus' is already in use. Please choose another one.
```

---

### Example 2: Email Already Registered

**Backend Response:**
```json
{
  "success": false,
  "error": {
    "code": "USER_3001",
    "message": "Email already registered",
    "details": {
      "email": "The email 'admin@test.com' is already registered."
    }
  }
}
```

**Frontend Display:**
```
Title: Registrasi Gagal
Description: The email 'admin@test.com' is already registered.
```

---

### Example 3: Multiple Validation Errors

**Backend Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "subdomain": "Subdomain must be 3-20 characters",
      "email": "Invalid email format",
      "phone": "Phone number must start with 08"
    }
  }
}
```

**Frontend Display:**
```
Title: Registrasi Gagal
Description: Subdomain must be 3-20 characters. Invalid email format. Phone number must start with 08
```

---

### Example 4: Plan Not Found

**Backend Response:**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Subscription plan not found",
    "details": {
      "plan_id": "The selected plan is not available"
    }
  }
}
```

**Frontend Display:**
```
Title: Registrasi Gagal
Description: The selected plan is not available
```

---

### Example 5: Generic Error (No Details)

**Backend Response:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

**Frontend Display:**
```
Title: Registrasi Gagal
Description: Internal server error
```

---

## Error Flow

```
1. User submits registration form
   ↓
2. Frontend calls api.signUp()
   ↓
3. Backend validates data
   ↓
4. Backend finds error (e.g., subdomain taken)
   ↓
5. Backend returns error response with details
   ↓
6. api.signUp() catches error
   ↓
7. Attach error.details and error.code
   ↓
8. Throw enhanced error
   ↓
9. Register page catches error
   ↓
10. Extract detailed message from error.details
    ↓
11. Display in toast notification
    ↓
12. User sees clear, specific error message
```

---

## Benefits

### 1. Clear Error Messages
- User knows exactly what went wrong
- Specific field-level errors
- Actionable feedback

### 2. Better UX
- No generic "Registration failed" messages
- User can fix the issue immediately
- Reduced frustration

### 3. Debugging
- Error codes help identify issues
- Detailed messages for support
- Easy to track error patterns

---

## Error Codes Reference

### Tenant Errors
- `TENANT_3001` - Tenant not found
- `TENANT_3002` - Tenant inactive
- `TENANT_3003` - Tenant creation failed
- `TENANT_3004` - Subdomain already taken

### User Errors
- `USER_3001` - Email already registered
- `USER_3002` - User not found
- `USER_3003` - Invalid credentials
- `USER_3004` - User inactive

### Plan Errors
- `PLAN_NOT_FOUND` - Subscription plan not found
- `PLAN_INACTIVE` - Plan is not active

### Validation Errors
- `VALIDATION_ERROR` - General validation error
- `INVALID_EMAIL` - Email format invalid
- `INVALID_PHONE` - Phone format invalid
- `INVALID_SUBDOMAIN` - Subdomain format invalid

---

## Testing

### Test Subdomain Already Taken

1. Register with subdomain "test"
2. Try register again with same subdomain
3. Should see: "The subdomain 'test' is already in use. Please choose another one."

### Test Email Already Registered

1. Register with email "admin@test.com"
2. Try register again with same email
3. Should see: "The email 'admin@test.com' is already registered."

### Test Invalid Format

1. Enter subdomain with spaces or special chars
2. Submit form
3. Should see: "Subdomain can only contain lowercase letters, numbers, and hyphens"

### Test Plan Not Found

1. Modify plan_id in request (use invalid UUID)
2. Submit form
3. Should see: "The selected plan is not available"

---

## Future Enhancements

### 1. Field-Specific Error Display

Instead of toast, show error under specific field:

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

// In catch block
if (error.details) {
  setFieldErrors(error.details);
}

// In JSX
<Input
  name="subdomain"
  error={fieldErrors.subdomain}
/>
{fieldErrors.subdomain && (
  <p className="text-sm text-destructive">{fieldErrors.subdomain}</p>
)}
```

### 2. Error Recovery Suggestions

```typescript
const getErrorSuggestion = (code: string) => {
  switch (code) {
    case 'TENANT_3004':
      return 'Try adding numbers or your location to the subdomain';
    case 'USER_3001':
      return 'Try logging in instead, or use a different email';
    default:
      return null;
  }
};
```

### 3. Error Logging

```typescript
catch (error: any) {
  // Log error for analytics
  console.error('Registration error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
  });
  
  // Display to user
  toast({ ... });
}
```

---

## Summary

**Enhanced Error Handling:**
- ✅ Extract error code from backend
- ✅ Extract error message from backend
- ✅ Extract detailed field errors from backend
- ✅ Display clear, specific error messages
- ✅ Better user experience

**Error Display:**
- Main message from `error.message`
- Detailed messages from `error.details`
- Multiple errors joined with ". "
- Shown in toast notification

**Example:**
```
Backend: { code: "TENANT_3004", details: { subdomain: "..." } }
Frontend: Toast shows detailed subdomain error message
```

**Ready to use!** 🚀
