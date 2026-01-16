# Changelog

## [1.1.0] - 2025-01-02

### Changed - Static Pricing Implementation

#### PricingSection Component
- **BREAKING:** Changed from API-based to static pricing
- Removed API call to fetch plans
- Removed loading state
- Removed error handling for API
- Plans now hardcoded in component
- Faster page load (no API latency)
- No backend dependency for pricing display

**Before:**
```typescript
// API call on component mount
useEffect(() => {
  const fetchPlans = async () => {
    const data = await api.getPlans();
    setPlans(data);
  };
  fetchPlans();
}, []);
```

**After:**
```typescript
// Static data
const plans = [
  { id: "550e8400-...", name: "Standard Plan", ... },
  { id: "550e8400-...", name: "Premium Plan", ... },
  { id: "550e8400-...", name: "Enterprise Plan", ... }
];
```

#### API Service
- Removed `getPlans()` function (no longer needed)
- Removed `Plan` interface (no longer needed)
- Kept `signUp()` function (still used for registration)

#### Benefits
- ✅ Faster page load (instant display)
- ✅ No API dependency for pricing
- ✅ Simpler code (no loading/error states)
- ✅ Better SEO (content immediately available)
- ✅ More reliable (no network errors)

#### Migration Notes
- Plan IDs in frontend **MUST** match database IDs
- To update pricing: edit `src/components/PricingSection.tsx`
- Plan ID still sent to backend during registration
- Backend still validates plan ID

### Fixed
- Fixed `plan.features.map is not a function` error
- Added safety checks for features array
- Improved error handling in registration

### Documentation
- Added `STATIC_PRICING.md` - Guide for static pricing
- Added `BUGFIX.md` - Bug fix documentation
- Updated `API_USAGE.md` - Reflect static pricing
- Updated `README.md` - Updated features list

---

## [1.0.0] - 2025-01-02

### Added - Initial API Integration

#### New Files
- `src/lib/api.ts` - API service layer
- `src/lib/validation.ts` - Form validation helpers
- `src/pages/Register.tsx` - Registration page
- `.env` - Environment variables
- `.env.example` - Environment template
- `Dockerfile` - Docker configuration
- `docker-compose.yml` - Docker compose
- `nginx.conf` - Nginx configuration
- `.dockerignore` - Docker ignore rules

#### Documentation
- `API_USAGE.md` - Developer guide
- `FRONTEND_INTEGRATION.md` - API integration guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `QUICK_START.md` - Quick start guide
- `README.md` - Updated with API info

#### Features
- API integration for signup
- Form validation (client-side)
- Error handling with toast notifications
- Loading states
- Auto redirect after registration
- Support for free trial and paid signup
- Docker deployment ready

#### Components
- Updated `PricingSection.tsx` - API integration (later changed to static)
- Updated `App.tsx` - Added routes for Register, Login, Dashboard
- Created `Register.tsx` - Full registration form

#### Validation
- Subdomain validation and sanitization
- Email format validation
- Phone number validation (Indonesian format)
- Password strength validation
- Form field matching (password confirmation)

---

## Version History

- **v1.1.0** - Static pricing implementation
- **v1.0.0** - Initial API integration

---

## Breaking Changes

### v1.1.0
- `api.getPlans()` removed - Use static data in component
- `Plan` interface removed from api.ts
- PricingSection no longer fetches from API

### Migration from v1.0.0 to v1.1.0

**If you were using API-based pricing:**

1. Remove any code that calls `api.getPlans()`
2. Update plan IDs in `src/components/PricingSection.tsx` to match database
3. Remove loading/error state handling for pricing
4. Test that plan IDs are correctly sent to backend

**No changes needed for:**
- Registration flow
- Form validation
- API signup endpoint
- Environment variables

---

## Upcoming Features

### Planned
- [ ] Payment integration
- [ ] Email verification flow
- [ ] Password strength indicator
- [ ] Real-time subdomain availability check
- [ ] Success page after registration
- [ ] Loading skeleton for better UX
- [ ] Analytics tracking
- [ ] A/B testing for pricing

### Under Consideration
- [ ] Multi-language support
- [ ] Currency selection
- [ ] Promo code support
- [ ] Referral system
- [ ] Social login (Google, Facebook)

---

## Support

For questions or issues:
- Check `STATIC_PRICING.md` for pricing configuration
- Check `API_USAGE.md` for API integration
- Check `QUICK_START.md` for getting started
- Check console browser for errors
- Check network tab for API calls

---

**Current Version:** 1.1.0  
**Last Updated:** 2025-01-02
