# Implementation Plan - Sistem Hotspot Voucher

- [x] 1. Setup database schema dan migrations


  - Buat migration file untuk tabel hotspot_packages, hotspot_vouchers, captive_portal_settings
  - Tambahkan indexes untuk performa
  - Buat migration untuk relasi dengan tabel yang sudah ada
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 12.1, 13.1, 14.1_



- [ ] 2. Implementasi domain entities dan repositories
  - [ ] 2.1 Buat domain entities
    - Implementasi struct HotspotPackage di `internal/domain/entity/hotspot_package.go`
    - Implementasi struct HotspotVoucher di `internal/domain/entity/hotspot_voucher.go`
    - Implementasi struct CaptivePortalSettings di `internal/domain/entity/captive_portal.go`


    - Implementasi struct HotspotSession di `internal/domain/entity/hotspot_session.go`
    - _Requirements: 1.1, 2.1, 3.1, 5.1_

  - [x] 2.2 Buat repository interfaces



    - Definisi interface HotspotPackageRepository di `internal/domain/repository/hotspot_package_repository.go`
    - Definisi interface HotspotVoucherRepository di `internal/domain/repository/hotspot_voucher_repository.go`
    - Definisi interface CaptivePortalRepository di `internal/domain/repository/captive_portal_repository.go`
    - _Requirements: 1.1, 2.1, 3.1, 5.1_

  - [ ] 2.3 Implementasi PostgreSQL repositories
    - Implementasi HotspotPackageRepository di `internal/repository/postgres/hotspot_package_repository.go`
    - Implementasi HotspotVoucherRepository di `internal/repository/postgres/hotspot_voucher_repository.go`
    - Implementasi CaptivePortalRepository di `internal/repository/postgres/captive_portal_repository.go`
    - Pastikan semua query menggunakan tenant_id untuk isolasi
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 12.3, 12.5_

  - [ ] 2.4 Write property test untuk repository
    - **Property 38: User tenant association**
    - **Validates: Requirements 12.1**

  - [ ] 2.5 Write property test untuk tenant isolation
    - **Property 40: Row-level security enforcement**
    - **Validates: Requirements 12.5**

- [ ] 3. Implementasi Hotspot Package Service
  - [ ] 3.1 Buat service interface dan implementasi
    - Implementasi HotspotPackageService di `internal/usecase/hotspot_package_service.go`
    - Method CreatePackage dengan validasi input
    - Method ListPackages dengan filter tenant
    - Method GetPackage, UpdatePackage, DeletePackage
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ] 3.2 Write property test untuk package creation
    - **Property 9: Package creation completeness**
    - **Validates: Requirements 3.1, 3.3**

  - [ ] 3.3 Write property test untuk package update isolation
    - **Property 12: Package update isolation**
    - **Validates: Requirements 3.5**

  - [ ] 3.4 Write unit tests untuk package service
    - Test create package dengan berbagai durasi
    - Test validasi input (durasi negatif, bandwidth invalid)
    - Test update package yang sedang digunakan
    - Test delete package yang memiliki voucher aktif
    - _Requirements: 3.1, 3.3, 3.5_

- [ ] 4. Implementasi Voucher Service
  - [ ] 4.1 Buat voucher generator
    - Implementasi fungsi generateVoucherCode() untuk random code
    - Implementasi fungsi generatePassword() untuk random password
    - Pastikan uniqueness dalam tenant scope
    - _Requirements: 2.1, 2.2_

  - [ ] 4.2 Implementasi HotspotVoucherService
    - Implementasi service di `internal/usecase/hotspot_voucher_service.go`
    - Method GenerateVouchers dengan batch support (max 100)
    - Method ListVouchers dengan pagination dan filter
    - Method GetVoucher, DeleteVoucher
    - Method ActivateVoucher untuk first login
    - Method GetVoucherStats untuk billing dashboard
    - _Requirements: 2.1, 2.3, 2.4, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 4.3 Write property test untuk voucher uniqueness
    - **Property 6: Voucher username uniqueness**
    - **Validates: Requirements 2.1, 2.2**

  - [ ] 4.4 Write property test untuk voucher package association
    - **Property 7: Voucher package association**
    - **Validates: Requirements 2.4**

  - [ ] 4.5 Write property test untuk expiration calculation
    - **Property 10: Expiration calculation correctness**
    - **Validates: Requirements 3.2**

  - [ ] 4.6 Write property test untuk activation timestamp
    - **Property 37: Activation timestamp recording**
    - **Validates: Requirements 11.5**

  - [ ] 4.7 Write unit tests untuk voucher service
    - Test generate voucher batch
    - Test uniqueness voucher code dalam tenant
    - Test aktivasi voucher pertama kali
    - Test voucher stats calculation
    - _Requirements: 2.1, 2.2, 11.1, 11.5_

- [ ] 5. Extend RADIUS server untuk hotspot authentication
  - [ ] 5.1 Implementasi hotspot authentication handler
    - Extend RADIUS server di `internal/infrastructure/radius/server.go`
    - Tambahkan handler untuk Access-Request dari hotspot
    - Verify credentials terhadap hotspot_vouchers table
    - Check voucher status (active, not expired)
    - Check device limit dan MAC binding
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 14.1, 14.2_

  - [ ] 5.2 Implementasi bandwidth authorization
    - Generate Mikrotik-Rate-Limit attribute dari package
    - Format: "upload/download" dalam bps
    - Include dalam Access-Accept response
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.3 Implementasi accounting handler
    - Handler untuk Accounting-Start: create session record
    - Handler untuk Accounting-Interim-Update: update session
    - Handler untuk Accounting-Stop: close session
    - Check session duration vs package duration
    - Mark voucher as expired jika duration exceeded
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 5.4 Implementasi tenant identification dari NAS
    - Lookup tenant berdasarkan NAS shared secret
    - Verify user belongs to correct tenant
    - _Requirements: 12.2, 12.4, 13.2_

  - [ ] 5.5 Write property test untuk valid credentials authentication
    - **Property 13: Valid credentials authentication**
    - **Validates: Requirements 4.2, 6.1, 6.2**

  - [ ] 5.6 Write property test untuk invalid credentials rejection
    - **Property 14: Invalid credentials rejection**
    - **Validates: Requirements 4.3, 6.3**

  - [ ] 5.7 Write property test untuk device limit enforcement
    - **Property 18: Device limit enforcement**
    - **Validates: Requirements 6.4**

  - [ ] 5.8 Write property test untuk MAC address recording
    - **Property 19: MAC address recording**
    - **Validates: Requirements 6.5**

  - [ ] 5.9 Write property test untuk bandwidth attributes
    - **Property 20: Access-Accept includes bandwidth attributes**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ] 5.10 Write property test untuk accounting session creation
    - **Property 22: Accounting-Start creates session record**
    - **Validates: Requirements 8.1**

  - [ ] 5.11 Write property test untuk MAC binding enforcement
    - **Property 47: MAC binding enforcement**
    - **Validates: Requirements 14.2, 14.3**

  - [ ] 5.12 Write unit tests untuk RADIUS hotspot handler
    - Test autentikasi dengan voucher valid
    - Test autentikasi dengan voucher expired
    - Test autentikasi dengan MAC address berbeda (MAC binding)
    - Test autentikasi melebihi device limit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 14.2_

- [ ] 6. Checkpoint - Pastikan semua tests passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implementasi Captive Portal Service
  - [ ] 7.1 Buat CaptivePortalService
    - Implementasi service di `internal/usecase/captive_portal_service.go`
    - Method GetPortalSettings untuk load branding
    - Method UpdatePortalSettings untuk update logo, text, colors
    - Method AuthenticateUser untuk login flow
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.2 Implementasi portal authentication flow
    - Terima username/password dari captive portal
    - Call RADIUS server untuk authentication
    - Return success dengan redirect URL atau error
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ] 7.3 Write property test untuk portal branding
    - **Property 16: Portal displays tenant branding**
    - **Validates: Requirements 4.5, 5.5**

  - [ ] 7.4 Write property test untuk portal settings persistence
    - **Property 17: Portal settings persistence**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ] 7.5 Write property test untuk authentication response
    - **Property 15: Authentication response contains redirect**
    - **Validates: Requirements 4.4**

  - [ ] 7.6 Write unit tests untuk captive portal service
    - Test get portal settings
    - Test update portal settings
    - Test authenticate user flow
    - _Requirements: 4.2, 5.1, 5.4_

- [ ] 8. Implementasi Session Monitoring Service
  - [ ] 8.1 Buat HotspotSessionService
    - Implementasi service di `internal/usecase/hotspot_session_service.go`
    - Method GetActiveSessions: query active sessions dari radius_accounting
    - Method DisconnectSession: send RADIUS disconnect request
    - Method CheckExpiredSessions: background job untuk auto-disconnect
    - _Requirements: 9.1, 9.2, 10.1, 10.2, 10.3, 15.1, 15.2_

  - [ ] 8.2 Implementasi RADIUS disconnect
    - Send Disconnect-Request packet ke NAS
    - Update session status di database
    - Handle disconnect errors
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [ ] 8.3 Implementasi session expiration checker
    - Background job yang run setiap 60 detik
    - Query active sessions
    - Calculate duration vs package limit
    - Mark expired dan send disconnect
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 8.4 Write property test untuk active sessions tenant isolation
    - **Property 27: Active sessions tenant isolation**
    - **Validates: Requirements 9.1, 12.3**

  - [ ] 8.5 Write property test untuk session response completeness
    - **Property 28: Session response completeness**
    - **Validates: Requirements 9.2**

  - [ ] 8.6 Write property test untuk disconnect status update
    - **Property 30: Disconnect updates session status**
    - **Validates: Requirements 10.3**

  - [ ] 8.7 Write property test untuk session expiration
    - **Property 50: Session expiration marking**
    - **Validates: Requirements 15.1**

  - [ ] 8.8 Write unit tests untuk session service
    - Test get active sessions
    - Test disconnect session
    - Test check expired sessions
    - _Requirements: 9.1, 10.1, 15.1_

- [ ] 9. Implementasi API handlers
  - [ ] 9.1 Buat hotspot package handlers
    - Handler di `internal/delivery/http/handler/hotspot_package_handler.go`
    - POST /api/v1/tenant/hotspot/packages - CreatePackage
    - GET /api/v1/tenant/hotspot/packages - ListPackages
    - GET /api/v1/tenant/hotspot/packages/:id - GetPackage
    - PUT /api/v1/tenant/hotspot/packages/:id - UpdatePackage
    - DELETE /api/v1/tenant/hotspot/packages/:id - DeletePackage
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ] 9.2 Buat hotspot voucher handlers
    - Handler di `internal/delivery/http/handler/hotspot_voucher_handler.go`
    - POST /api/v1/tenant/hotspot/vouchers/generate - GenerateVouchers
    - GET /api/v1/tenant/hotspot/vouchers - ListVouchers
    - GET /api/v1/tenant/hotspot/vouchers/:id - GetVoucher
    - DELETE /api/v1/tenant/hotspot/vouchers/:id - DeleteVoucher
    - GET /api/v1/tenant/hotspot/vouchers/stats - GetVoucherStats
    - _Requirements: 2.1, 2.3, 11.1, 11.2, 11.3_

  - [ ] 9.3 Buat captive portal handlers
    - Handler di `internal/delivery/http/handler/captive_portal_handler.go`
    - GET /api/v1/public/hotspot/portal/:tenant_id - GetPortalPage
    - POST /api/v1/public/hotspot/login - AuthenticateUser
    - GET /api/v1/tenant/hotspot/portal/settings - GetPortalSettings
    - PUT /api/v1/tenant/hotspot/portal/settings - UpdatePortalSettings
    - _Requirements: 4.1, 4.2, 5.1, 5.4_

  - [ ] 9.4 Buat session monitoring handlers
    - Handler di `internal/delivery/http/handler/hotspot_session_handler.go`
    - GET /api/v1/tenant/hotspot/sessions - GetActiveSessions
    - POST /api/v1/tenant/hotspot/sessions/:id/disconnect - DisconnectSession
    - _Requirements: 9.1, 10.1_

  - [ ] 9.5 Buat NAS management handlers
    - Handler di `internal/delivery/http/handler/hotspot_nas_handler.go`
    - POST /api/v1/tenant/hotspot/nas - AddNAS
    - GET /api/v1/tenant/hotspot/nas - ListNAS
    - PUT /api/v1/tenant/hotspot/nas/:id - UpdateNAS
    - DELETE /api/v1/tenant/hotspot/nas/:id - DeleteNAS
    - _Requirements: 13.1, 13.4, 13.5_

  - [ ] 9.6 Buat DTOs untuk request/response
    - DTO di `internal/delivery/http/dto/hotspot_dto.go`
    - CreatePackageRequest, UpdatePackageRequest, PackageResponse
    - GenerateVouchersRequest, VoucherResponse, VoucherStatsResponse
    - UpdatePortalSettingsRequest, PortalSettingsResponse
    - AuthenticateRequest, AuthResponse
    - SessionResponse, DisconnectRequest
    - _Requirements: All API endpoints_

  - [ ] 9.7 Register routes
    - Update router di `internal/delivery/http/router/router.go`
    - Register semua hotspot endpoints
    - Apply tenant auth middleware untuk tenant endpoints
    - Public endpoints untuk captive portal
    - _Requirements: All API endpoints_

- [ ] 10. Checkpoint - Test API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implementasi Frontend - Hotspot Management (UserDashboard)
  - [ ] 11.1 Buat API client functions
    - File `src/api/hotspot.api.ts`
    - Functions untuk packages: createPackage, listPackages, updatePackage, deletePackage
    - Functions untuk vouchers: generateVouchers, listVouchers, deleteVoucher, getVoucherStats
    - Functions untuk portal: getPortalSettings, updatePortalSettings
    - Functions untuk sessions: getActiveSessions, disconnectSession
    - Functions untuk NAS: addNAS, listNAS, updateNAS, deleteNAS
    - _Requirements: All API endpoints_

  - [ ] 11.2 Buat Hotspot Package Management page
    - Page `src/pages/HotspotPackages.tsx`
    - Component `src/features/hotspot/PackageTable.tsx` untuk list packages
    - Component `src/features/hotspot/PackageForm.tsx` untuk create/edit
    - Form fields: name, duration type, duration, price, speed upload/download, device limit, MAC binding
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ] 11.3 Buat Voucher Management page
    - Page `src/pages/HotspotVouchers.tsx`
    - Component `src/features/hotspot/VoucherGenerator.tsx` untuk generate batch
    - Component `src/features/hotspot/VoucherTable.tsx` untuk list vouchers
    - Filter by status, package, date range
    - Display voucher code, password, package, status, expires_at
    - Action: delete voucher
    - _Requirements: 2.1, 2.3, 2.5, 11.2_

  - [ ] 11.4 Buat Session Monitoring page
    - Page `src/pages/HotspotSessions.tsx`
    - Component `src/features/hotspot/SessionMonitor.tsx` untuk real-time sessions
    - Display username, IP, MAC, duration, bytes transferred
    - Action: disconnect session
    - Auto-refresh setiap 5 detik
    - _Requirements: 9.1, 9.2, 9.5, 10.1_

  - [ ] 11.5 Buat Captive Portal Settings page
    - Page `src/pages/HotspotPortal.tsx`
    - Component `src/features/hotspot/PortalCustomizer.tsx`
    - Upload logo image
    - Input promotional text
    - Input redirect URL
    - Color pickers untuk primary/secondary colors
    - Preview portal appearance
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 11.6 Buat NAS Management page
    - Page `src/pages/HotspotNAS.tsx`
    - Component `src/features/hotspot/NASTable.tsx` untuk list NAS
    - Component `src/features/hotspot/NASForm.tsx` untuk add/edit
    - Form fields: name, IP address, shared secret, description
    - _Requirements: 13.1, 13.4, 13.5_

  - [ ] 11.7 Buat Voucher Reports page
    - Page `src/pages/HotspotReports.tsx`
    - Component `src/features/hotspot/VoucherStats.tsx`
    - Display total vouchers per package
    - Display used/unused/expired counts
    - Display revenue per package
    - Date range filter
    - Charts untuk visualisasi
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 11.8 Update Sidebar navigation
    - Update `src/components/layout/Sidebar.tsx`
    - Tambahkan menu group "Hotspot"
    - Menu items: Packages, Vouchers, Sessions, Portal, NAS, Reports
    - Icons dari lucide-react
    - _Requirements: All pages_

- [ ] 12. Implementasi Captive Portal Frontend (Standalone App)
  - [ ] 12.1 Setup captive portal React app
    - Buat folder `Frontend/CaptivePortal`
    - Setup Vite + React + TypeScript
    - Setup TailwindCSS
    - Minimal dependencies (lightweight)
    - _Requirements: 4.1_

  - [ ] 12.2 Buat login page
    - Component `src/pages/Login.tsx`
    - Display tenant logo (dari API)
    - Display promotional text
    - Form: username, password
    - Submit button
    - Error message display
    - Loading state
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ] 12.3 Buat success page
    - Component `src/pages/Success.tsx`
    - Display success message
    - Auto-redirect ke internet atau tenant URL
    - Countdown timer
    - _Requirements: 4.4_

  - [ ] 12.4 Implementasi API integration
    - File `src/api/portal.api.ts`
    - Function getPortalSettings(tenantId)
    - Function authenticateUser(username, password, macAddress)
    - Handle errors
    - _Requirements: 4.2, 5.5_

  - [ ] 12.5 Implementasi branding logic
    - Load portal settings dari API berdasarkan tenant_id
    - Apply logo, colors, text dynamically
    - Fallback ke default branding jika tenant tidak ditemukan
    - _Requirements: 5.5_

  - [ ] 12.6 Build dan deployment config
    - Dockerfile untuk captive portal
    - Nginx config untuk serving static files
    - Environment variables untuk API URL
    - _Requirements: 4.1_

- [ ] 13. Implementasi Background Jobs
  - [ ] 13.1 Setup job scheduler
    - Gunakan cron atau scheduler library (e.g., robfig/cron)
    - Setup di `cmd/api/main.go`
    - _Requirements: 15.3_

  - [ ] 13.2 Implementasi session expiration job
    - Job yang run setiap 60 detik
    - Call HotspotSessionService.CheckExpiredSessions()
    - Log execution dan errors
    - _Requirements: 15.1, 15.2, 15.3_

  - [ ] 13.3 Implementasi voucher status updater job
    - Job yang run setiap 5 menit
    - Update voucher status dari "active" ke "expired"
    - Update voucher status dari "unused" ke "expired" (jika ada validity period)
    - _Requirements: 15.4_

  - [ ] 13.4 Write unit tests untuk background jobs
    - Test session expiration checker
    - Test voucher status updater
    - _Requirements: 15.1, 15.4_

- [ ] 14. Implementasi caching
  - [ ] 14.1 Cache portal settings
    - Cache di Redis dengan key: `portal:settings:{tenant_id}`
    - TTL: 5 minutes
    - Invalidate on update
    - _Requirements: 5.4_

  - [ ] 14.2 Cache package info
    - Cache di Redis dengan key: `hotspot:package:{package_id}`
    - TTL: 10 minutes
    - Invalidate on update
    - _Requirements: 3.5_

  - [ ] 14.3 Cache NAS configuration
    - Cache di Redis dengan key: `hotspot:nas:{nas_ip}`
    - TTL: indefinite (invalidate on update)
    - _Requirements: 13.4_

- [ ] 15. Security enhancements
  - [ ] 15.1 Implementasi password hashing untuk vouchers
    - Hash voucher password dengan bcrypt sebelum simpan
    - Verify password saat authentication
    - _Requirements: 6.1_

  - [ ] 15.2 Implementasi rate limiting untuk login
    - Rate limit: max 5 attempts per minute per IP
    - Gunakan Redis untuk tracking
    - Return 429 Too Many Requests jika exceeded
    - _Requirements: 4.2_

  - [ ] 15.3 Implementasi RADIUS authenticator validation
    - Validate RADIUS packet authenticator
    - Reject packets dengan invalid authenticator
    - _Requirements: 6.1_

- [ ] 16. Checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Documentation dan deployment
  - [ ] 17.1 Update API documentation
    - Update Swagger docs dengan hotspot endpoints
    - Tambahkan examples untuk request/response
    - _Requirements: All API endpoints_

  - [ ] 17.2 Buat user guide
    - Dokumentasi cara setup hotspot
    - Cara generate voucher
    - Cara kustomisasi captive portal
    - Cara monitoring sessions
    - _Requirements: All features_

  - [ ] 17.3 Update deployment configs
    - Update Kubernetes manifests untuk captive portal
    - Update docker-compose.yml
    - Update environment variables
    - _Requirements: Deployment_

  - [ ] 17.4 Setup monitoring
    - Prometheus metrics untuk RADIUS
    - Grafana dashboard untuk hotspot
    - Alerts untuk authentication failures
    - _Requirements: Monitoring_

- [ ] 18. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
