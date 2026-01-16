# Design Document - OpenAPI Documentation

## Overview

Implementasi dokumentasi API lengkap menggunakan OpenAPI 3.0 dengan Swagger UI terintegrasi. Dokumentasi akan auto-generated dari godoc comments menggunakan swaggo/swag library, memastikan dokumentasi selalu sinkron dengan kode.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Swagger UI (Browser)                     │
│                  http://localhost:8089/swagger               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Gin Router                              │
│                                                              │
│  GET /swagger/*any  →  ginSwagger.WrapHandler()            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ Serve Static Files
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   docs/swagger/                              │
│                                                              │
│  ├── docs.go         (Generated Go code)                    │
│  ├── swagger.json    (OpenAPI JSON)                         │
│  └── swagger.yaml    (OpenAPI YAML)                         │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │
                             │ swag init
                             │
┌─────────────────────────────────────────────────────────────┐
│                   Handler Files                              │
│                                                              │
│  // HandlerName godoc                                        │
│  // @Summary ...                                             │
│  // @Router ...                                              │
│  func (h *Handler) HandlerName(c *gin.Context) {}          │
└─────────────────────────────────────────────────────────────┘
```

### Flow

1. **Development**: Developer adds godoc comments to handlers
2. **Generation**: Run `swag init` to generate OpenAPI spec
3. **Serving**: Gin serves Swagger UI at `/swagger/index.html`
4. **Interaction**: Users test API via Swagger UI
5. **Export**: OpenAPI spec available at `/swagger/doc.json`

## Components and Interfaces

### 1. Swagger Generator (swaggo/swag)

**Purpose**: Parse godoc comments and generate OpenAPI specification

**Configuration** (cmd/api/main.go):
```go
// @title           RT RW Net SaaS Backend API
// @version         2.0.0
// @description     API untuk sistem manajemen RT RW Net

// @contact.name   RT RW Net Support
// @contact.email  support@rtrwnet.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8089
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

// @securityDefinitions.apikey TenantID
// @in header
// @name X-Tenant-ID
```

### 2. Handler Documentation

**Template**:
```go
// HandlerName godoc
// @Summary      Short description
// @Description  Long description
// @Tags         TagName
// @Accept       json
// @Produce      json
// @Param        name  location  type  required  "description"
// @Success      200   {object}  ResponseType
// @Failure      400   {object}  ErrorType
// @Router       /path [method]
// @Security     BearerAuth
func (h *Handler) HandlerName(c *gin.Context) {
    // Implementation
}
```

### 3. Swagger UI Integration

**Router Setup** (internal/delivery/http/router/router.go):
```go
import (
    swaggerFiles "github.com/swaggo/files"
    ginSwagger "github.com/swaggo/gin-swagger"
    _ "github.com/rtrwnet/saas-backend/docs/swagger"
)

func SetupRouter(cfg *RouterConfig) *gin.Engine {
    router := gin.Default()
    
    // Swagger route
    router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
    
    // Other routes...
    return router
}
```

## Data Models

### OpenAPI Specification Structure

```yaml
openapi: 3.0.3
info:
  title: RT RW Net SaaS Backend API
  version: 2.0.0
  description: API documentation
  
servers:
  - url: http://localhost:8089/api/v1
    description: Development server
    
tags:
  - name: Public
    description: Public endpoints
  - name: Authentication
    description: Auth endpoints
  - name: Billing
    description: Billing endpoints
    
paths:
  /auth/simple-login:
    post:
      tags: [Authentication]
      summary: Simple login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SimpleLoginRequest'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
                
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    TenantID:
      type: apiKey
      in: header
      name: X-Tenant-ID
      
  schemas:
    SimpleLoginRequest:
      type: object
      required: [username, password]
      properties:
        username:
          type: string
          format: email
        password:
          type: string
          minLength: 6
```

### Handler Documentation Mapping

| Handler | Tag | Security | Description |
|---------|-----|----------|-------------|
| GetPlans | Public | None | Get subscription plans |
| SignUp | Public | None | Register new tenant |
| SimpleLogin | Authentication | None | Login with email |
| Login | Authentication | None | Login with tenant ID |
| Logout | Authentication | Bearer + Tenant | Logout user |
| RefreshToken | Authentication | None | Refresh access token |
| Me | Authentication | Bearer + Tenant | Get current user |
| Register | Authentication | None | Register new user |
| GetBillingDashboard | Billing | Bearer + Tenant | Get billing info |
| UpdateSubscription | Billing | Bearer + Tenant | Update subscription |
| CancelSubscription | Billing | Bearer + Tenant | Cancel subscription |
| UpdatePaymentMethod | Billing | Bearer + Tenant | Update payment |
| UpdateTenantSettings | Billing | Bearer + Tenant | Update settings |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Documentation Completeness
*For any* public handler function, the generated OpenAPI spec should include endpoint path, method, request schema, and all possible response schemas.
**Validates: Requirements 1.2, 5.1, 5.2**

### Property 2: Security Annotation Consistency
*For any* protected endpoint, the OpenAPI spec should include both BearerAuth and TenantID security requirements.
**Validates: Requirements 7.3, 7.5**

### Property 3: Error Response Coverage
*For any* endpoint, the OpenAPI spec should document at minimum 400, 401 (if protected), and 500 status codes.
**Validates: Requirements 6.1, 13.2, 13.5**

### Property 4: Schema Validation
*For any* request/response schema, all fields should have defined types, formats, and required/optional indicators.
**Validates: Requirements 5.3, 5.4**

### Property 5: Tag Organization
*For any* endpoint, it should be assigned to exactly one tag that logically groups related functionality.
**Validates: Requirements 8.1, 8.2**

### Property 6: Example Value Presence
*For any* schema in the OpenAPI spec, example values should be provided for all primitive fields.
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 7: Regeneration Idempotence
*For any* unchanged handler, running `swag init` multiple times should produce identical OpenAPI spec.
**Validates: Requirements 10.3, 10.4**

### Property 8: Export Format Validity
*For any* generated OpenAPI spec, it should be valid according to OpenAPI 3.0 specification and parseable by standard tools.
**Validates: Requirements 11.3, 11.4**

## Error Handling

### Documentation Generation Errors

**Error**: Handler missing godoc comments
```
Solution: Add complete godoc comment block with all required annotations
```

**Error**: Invalid annotation syntax
```
Solution: Follow swaggo annotation format exactly, check for typos
```

**Error**: Type not found in schema
```
Solution: Ensure all referenced types are exported and in correct package
```

### Runtime Errors

**Error**: Swagger UI 404
```
Solution: 
1. Check import: _ "github.com/rtrwnet/saas-backend/docs/swagger"
2. Check route: router.GET("/swagger/*any", ...)
3. Regenerate docs: swag init
```

**Error**: Documentation not updating
```
Solution:
1. Regenerate: swag init -g cmd/api/main.go -o docs/swagger
2. Restart server
3. Clear browser cache
```

## Testing Strategy

### Unit Tests

**Test 1**: Verify all handlers have godoc comments
```go
func TestHandlersHaveDocumentation(t *testing.T) {
    // Parse handler files
    // Check for godoc comments
    // Verify required annotations present
}
```

**Test 2**: Validate generated OpenAPI spec
```go
func TestOpenAPISpecValid(t *testing.T) {
    // Load swagger.json
    // Validate against OpenAPI 3.0 schema
    // Check all required fields present
}
```

### Integration Tests

**Test 1**: Swagger UI accessibility
```go
func TestSwaggerUIAccessible(t *testing.T) {
    // Start test server
    // GET /swagger/index.html
    // Assert 200 status
    // Assert HTML content
}
```

**Test 2**: OpenAPI JSON endpoint
```go
func TestOpenAPIJSONEndpoint(t *testing.T) {
    // Start test server
    // GET /swagger/doc.json
    // Assert 200 status
    // Assert valid JSON
    // Assert contains expected endpoints
}
```

### Manual Testing Checklist

- [ ] Access Swagger UI at /swagger/index.html
- [ ] Verify all endpoints visible
- [ ] Test "Try it out" on public endpoint
- [ ] Test authentication flow
- [ ] Test protected endpoint with auth
- [ ] Verify error responses documented
- [ ] Export OpenAPI spec
- [ ] Import to Postman successfully
- [ ] Generate TypeScript types successfully

## Implementation Notes

### Annotation Best Practices

1. **Always include**:
   - @Summary (short, 1 line)
   - @Description (detailed)
   - @Tags (logical grouping)
   - @Router (path and method)

2. **For requests**:
   - @Accept json
   - @Param for all parameters
   - Use correct location (path, query, body, header)

3. **For responses**:
   - @Produce json
   - @Success with schema
   - @Failure for all error cases

4. **For security**:
   - @Security BearerAuth (for protected endpoints)
   - @Security TenantID (for tenant-specific endpoints)

### Common Patterns

**Public Endpoint**:
```go
// GetPlans godoc
// @Summary      Get subscription plans
// @Description  Retrieve all available subscription plans
// @Tags         Public
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.SuccessResponse{data=dto.PlansResponse}
// @Failure      500  {object}  response.ErrorResponse
// @Router       /public/plans [get]
```

**Protected Endpoint**:
```go
// GetBillingDashboard godoc
// @Summary      Get billing dashboard
// @Description  Get complete billing information
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Success      200  {object}  response.SuccessResponse{data=dto.BillingDashboardResponse}
// @Failure      401  {object}  response.ErrorResponse
// @Failure      404  {object}  response.ErrorResponse
// @Router       /billing [get]
```

**With Request Body**:
```go
// SignUp godoc
// @Summary      Sign up new tenant
// @Description  Register a new tenant with optional free trial
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        request  body      dto.SignUpRequest  true  "Sign up request"
// @Success      201      {object}  response.SuccessResponse{data=dto.SignUpResponse}
// @Failure      400      {object}  response.ErrorResponse
// @Failure      409      {object}  response.ErrorResponse
// @Router       /public/signup [post]
```

### Regeneration Workflow

1. **Add/modify handler**
2. **Add/update godoc comments**
3. **Regenerate docs**: `make swagger`
4. **Verify**: Check docs/swagger/swagger.yaml
5. **Test**: Restart server and check Swagger UI
6. **Commit**: Include generated files in git

### File Structure

```
project/
├── cmd/api/main.go                    # Main annotations
├── internal/delivery/http/
│   ├── handler/                       # Handler godoc comments
│   │   ├── auth_handler.go
│   │   ├── billing_handler.go
│   │   └── subscription_handler.go
│   └── dto/                           # Schema definitions
│       ├── auth_dto.go
│       ├── billing_dto.go
│       └── subscription_dto.go
├── docs/swagger/                      # Generated files
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
└── Makefile                           # swagger command
```

## Summary

OpenAPI documentation akan di-generate otomatis dari godoc comments menggunakan swaggo/swag. Setiap handler akan didokumentasikan dengan lengkap termasuk request/response schemas, error cases, dan security requirements. Swagger UI akan tersedia di `/swagger/index.html` untuk interactive testing. Documentation dapat di-export sebagai OpenAPI JSON/YAML untuk digunakan dengan tools lain seperti Postman atau code generators.
