# Implementation Plan - OpenAPI Documentation

## Tasks

- [x] 1. Add godoc comments to Authentication handlers


  - Add complete OpenAPI annotations to all auth endpoints
  - Include request/response schemas
  - Document all error cases
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_



- [ ] 1.1 Document SimpleLogin handler
  - @Summary, @Description, @Tags
  - @Param for request body
  - @Success 200 with AuthResponse
  - @Failure 400, 401, 500


  - _Requirements: 2.1_

- [ ] 1.2 Document Login handler
  - @Summary, @Description, @Tags
  - @Param for request body with tenant_id


  - @Success 200 with AuthResponse
  - @Failure 400, 401, 500
  - _Requirements: 2.2_

- [x] 1.3 Document RefreshToken handler


  - @Summary, @Description, @Tags
  - @Param for refresh_token
  - @Success 200 with TokenResponse
  - @Failure 401, 500
  - _Requirements: 2.3_



- [ ] 1.4 Document Logout handler
  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID
  - @Param for request body
  - @Success 200


  - @Failure 401, 500
  - _Requirements: 2.4_

- [x] 1.5 Document Me handler


  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID
  - @Success 200 with UserProfile
  - @Failure 401, 500
  - _Requirements: 2.5_



- [ ] 1.6 Document Register handler
  - @Summary, @Description, @Tags
  - @Param for request body


  - @Success 201 with RegisterResponse
  - @Failure 400, 409, 500
  - _Requirements: 2.6_

- [ ] 2. Add godoc comments to Public endpoints
  - Document subscription plans endpoint
  - Document sign-up endpoint with all validations


  - Include free trial documentation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Document GetPlans handler


  - @Summary, @Description, @Tags
  - @Success 200 with PlansResponse
  - @Failure 500
  - _Requirements: 3.1_



- [ ] 2.2 Document SignUp handler
  - @Summary, @Description, @Tags
  - @Param for complete SignUpRequest
  - Document email uniqueness requirement
  - Document free trial option


  - @Success 201 with SignUpResponse
  - @Failure 400, 409, 500
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 2.3 Document PaymentWebhook handler
  - @Summary, @Description, @Tags


  - @Param for webhook request
  - @Success 200
  - @Failure 400, 500
  - _Requirements: 3.2_

- [x] 3. Add godoc comments to Billing endpoints


  - Document all billing management endpoints
  - Include authentication requirements
  - Document tenant ID requirement
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 3.1 Document GetBillingDashboard handler


  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID
  - @Success 200 with BillingDashboardResponse
  - @Failure 401, 404, 500
  - _Requirements: 4.1, 4.6_



- [ ] 3.2 Document UpdateSubscription handler
  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID


  - @Param for UpdateSubscriptionRequest
  - @Success 200
  - @Failure 400, 401, 500
  - _Requirements: 4.2, 4.6_



- [ ] 3.3 Document CancelSubscription handler
  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID


  - @Param for CancelSubscriptionRequest
  - @Success 200
  - @Failure 401, 404, 500


  - _Requirements: 4.3, 4.6_

- [ ] 3.4 Document UpdatePaymentMethod handler
  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID


  - @Param for UpdatePaymentMethodRequest
  - @Success 200
  - @Failure 400, 401, 500
  - _Requirements: 4.4, 4.6_

- [ ] 3.5 Document UpdateTenantSettings handler
  - @Summary, @Description, @Tags
  - @Security BearerAuth, TenantID
  - @Param for UpdateTenantSettingsRequest
  - @Success 200
  - @Failure 400, 401, 500
  - _Requirements: 4.5, 4.6_

- [ ] 4. Add godoc comments to Tenant management endpoints
  - Document tenant CRUD operations
  - Include admin-only requirements
  - _Requirements: 8.1, 8.2_

- [ ] 4.1 Document CreateTenant handler
  - @Summary, @Description, @Tags
  - @Param for CreateTenantRequest
  - @Success 201 with TenantResponse
  - @Failure 400, 409, 500

- [ ] 4.2 Document GetTenantByID handler
  - @Summary, @Description, @Tags
  - @Param id in path
  - @Success 200 with TenantResponse
  - @Failure 404, 500



- [ ] 4.3 Document ListTenants handler
  - @Summary, @Description, @Tags
  - @Success 200 with array of TenantResponse
  - @Failure 500



- [ ] 4.4 Document UpdateTenant handler
  - @Summary, @Description, @Tags
  - @Param id in path


  - @Param for UpdateTenantRequest
  - @Success 200 with TenantResponse
  - @Failure 400, 404, 500


- [ ] 4.5 Document DeleteTenant handler
  - @Summary, @Description, @Tags
  - @Param id in path

  - @Success 200
  - @Failure 404, 500

- [ ] 5. Add example values to all DTOs
  - Add struct tags with example values
  - Ensure realistic data in examples
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 5.1 Add examples to auth DTOs
  - SimpleLoginRequest, LoginRequest
  - AuthResponse, TokenResponse
  - RegisterRequest, RegisterResponse

- [ ] 5.2 Add examples to subscription DTOs
  - SignUpRequest, SignUpResponse
  - SubscriptionPlan
  - PaymentWebhookRequest

- [ ] 5.3 Add examples to billing DTOs
  - BillingDashboardResponse
  - UpdateSubscriptionRequest
  - CancelSubscriptionRequest
  - UpdatePaymentMethodRequest
  - UpdateTenantSettingsRequest

- [ ] 5.4 Add examples to tenant DTOs
  - CreateTenantRequest
  - UpdateTenantRequest
  - TenantResponse

- [ ] 6. Regenerate OpenAPI documentation
  - Run swag init command
  - Verify generated files
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 6.1 Run swagger generation
  - Execute: `swag init -g cmd/api/main.go -o docs/swagger`
  - Verify docs.go created
  - Verify swagger.json created
  - Verify swagger.yaml created

- [ ] 6.2 Validate generated spec
  - Check OpenAPI 3.0 compliance
  - Verify all endpoints present
  - Verify all schemas present
  - Verify security definitions present

- [ ] 7. Test Swagger UI functionality
  - Verify UI loads correctly
  - Test interactive features
  - _Requirements: 1.1, 1.2, 1.3, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 7.1 Test Swagger UI access

  - Start server
  - Access /swagger/index.html
  - Verify UI loads
  - Verify all endpoints visible

- [ ] 7.2 Test "Try it out" feature
  - Test public endpoint (GetPlans)
  - Test with request body (SignUp)
  - Verify request/response display

- [ ] 7.3 Test authentication flow
  - Click "Authorize" button
  - Add Bearer token
  - Test protected endpoint
  - Verify auth headers included

- [ ] 8. Test OpenAPI export
  - Verify JSON endpoint works
  - Test import to Postman
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 8.1 Test JSON export
  - Access /swagger/doc.json
  - Verify valid JSON
  - Verify complete spec

- [ ] 8.2 Test Postman import
  - Import swagger.json to Postman
  - Verify all endpoints imported
  - Verify request/response schemas

- [ ] 9. Create documentation guide
  - Write guide for adding new endpoints
  - Document regeneration process
  - _Requirements: 10.5_

- [ ] 9.1 Create OPENAPI_HANDBOOK.md
  - How to add godoc comments
  - Annotation reference
  - Common patterns
  - Troubleshooting guide

- [ ] 10. Final verification
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All_

- [ ] 10.1 Verify all endpoints documented
  - Check each handler has godoc comments
  - Check all annotations complete
  - Check examples present

- [ ] 10.2 Verify Swagger UI works
  - Test all endpoint groups
  - Test authentication
  - Test interactive features

- [ ] 10.3 Verify export functionality
  - Test JSON export
  - Test YAML export
  - Test Postman import

- [ ] 10.4 Update project documentation
  - Update README with Swagger info
  - Update SWAGGER_INSTALLED.md
  - Create quick reference guide
