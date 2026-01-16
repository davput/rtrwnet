# Requirements Document - OpenAPI Documentation

## Introduction

Membuat dokumentasi API lengkap menggunakan OpenAPI 3.0 specification dengan Swagger UI yang terintegrasi di project RT RW Net SaaS Backend. Dokumentasi harus auto-generated dari godoc comments dan selalu up-to-date dengan kode.

## Glossary

- **OpenAPI**: Specification standard untuk mendokumentasikan REST APIs
- **Swagger UI**: Interactive web interface untuk testing dan viewing API documentation
- **godoc**: Go documentation comments yang digunakan untuk generate OpenAPI spec
- **swaggo**: Library Go untuk generate OpenAPI documentation dari godoc comments
- **Handler**: HTTP request handler function di Gin framework
- **Endpoint**: API route yang dapat diakses (e.g., GET /api/v1/users)

## Requirements

### Requirement 1: Swagger UI Integration

**User Story:** As a developer, I want to access interactive API documentation via web browser, so that I can test and understand all available endpoints.

#### Acceptance Criteria

1. WHEN a developer accesses `/swagger/index.html` THEN the System SHALL display Swagger UI with complete API documentation
2. WHEN Swagger UI loads THEN the System SHALL show all available endpoints grouped by tags
3. WHEN a developer clicks "Try it out" on any endpoint THEN the System SHALL allow interactive testing with request/response examples
4. WHEN the server starts THEN the System SHALL automatically serve Swagger UI without additional configuration
5. WHEN documentation is regenerated THEN the System SHALL reflect changes immediately after server restart

### Requirement 2: Authentication Documentation

**User Story:** As a frontend developer, I want clear documentation of authentication endpoints, so that I can implement login/logout functionality correctly.

#### Acceptance Criteria

1. WHEN viewing auth endpoints THEN the System SHALL document `/auth/simple-login` with email-only login flow
2. WHEN viewing auth endpoints THEN the System SHALL document `/auth/login` with tenant ID requirement
3. WHEN viewing auth endpoints THEN the System SHALL document `/auth/refresh` for token refresh
4. WHEN viewing auth endpoints THEN the System SHALL document `/auth/logout` for session termination
5. WHEN viewing auth endpoints THEN the System SHALL document `/auth/me` for getting current user
6. WHEN viewing auth endpoints THEN the System SHALL document `/auth/register` for user registration
7. WHEN viewing protected endpoints THEN the System SHALL show Bearer token requirement in security section

### Requirement 3: Public Endpoints Documentation

**User Story:** As a frontend developer, I want documentation of public endpoints, so that I can implement sign-up and plan selection features.

#### Acceptance Criteria

1. WHEN viewing public endpoints THEN the System SHALL document `/public/plans` with all subscription plans
2. WHEN viewing public endpoints THEN the System SHALL document `/public/signup` with complete sign-up flow
3. WHEN viewing sign-up endpoint THEN the System SHALL show email uniqueness requirement
4. WHEN viewing sign-up endpoint THEN the System SHALL document free trial option
5. WHEN viewing sign-up endpoint THEN the System SHALL show all required fields with validation rules

### Requirement 4: Billing Endpoints Documentation

**User Story:** As a frontend developer, I want documentation of billing endpoints, so that I can implement subscription management features.

#### Acceptance Criteria

1. WHEN viewing billing endpoints THEN the System SHALL document `/billing` dashboard endpoint
2. WHEN viewing billing endpoints THEN the System SHALL document `/billing/subscription` for plan updates
3. WHEN viewing billing endpoints THEN the System SHALL document `/billing/cancel` for cancellation
4. WHEN viewing billing endpoints THEN the System SHALL document `/billing/payment-method` for payment updates
5. WHEN viewing billing endpoints THEN the System SHALL document `/billing/settings` for tenant settings
6. WHEN viewing billing endpoints THEN the System SHALL show authentication and tenant ID requirements

### Requirement 5: Request/Response Schema Documentation

**User Story:** As a developer, I want complete request and response schemas documented, so that I can understand data structures without reading code.

#### Acceptance Criteria

1. WHEN viewing any endpoint THEN the System SHALL show complete request body schema with all fields
2. WHEN viewing any endpoint THEN the System SHALL show all possible response schemas (success and errors)
3. WHEN viewing schemas THEN the System SHALL show field types, formats, and constraints
4. WHEN viewing schemas THEN the System SHALL show required vs optional fields
5. WHEN viewing schemas THEN the System SHALL provide example values for all fields

### Requirement 6: Error Response Documentation

**User Story:** As a frontend developer, I want all possible error responses documented, so that I can handle errors appropriately.

#### Acceptance Criteria

1. WHEN viewing any endpoint THEN the System SHALL document all possible HTTP status codes
2. WHEN viewing error responses THEN the System SHALL show error code format (e.g., AUTH_1001)
3. WHEN viewing error responses THEN the System SHALL show error message structure
4. WHEN viewing error responses THEN the System SHALL show error details object when applicable
5. WHEN viewing validation errors THEN the System SHALL show field-specific error messages

### Requirement 7: Security Scheme Documentation

**User Story:** As a developer, I want security requirements clearly documented, so that I can implement authentication correctly.

#### Acceptance Criteria

1. WHEN viewing API documentation THEN the System SHALL define BearerAuth security scheme
2. WHEN viewing API documentation THEN the System SHALL define TenantID header requirement
3. WHEN viewing protected endpoints THEN the System SHALL show which security schemes are required
4. WHEN testing in Swagger UI THEN the System SHALL provide "Authorize" button for adding tokens
5. WHEN authorized in Swagger UI THEN the System SHALL automatically include tokens in all requests

### Requirement 8: Tag-Based Organization

**User Story:** As a developer, I want endpoints organized by logical groups, so that I can find related endpoints easily.

#### Acceptance Criteria

1. WHEN viewing documentation THEN the System SHALL group endpoints by tags (Public, Authentication, Billing, etc)
2. WHEN viewing a tag group THEN the System SHALL show all endpoints in that category
3. WHEN viewing documentation THEN the System SHALL show tag descriptions
4. WHEN viewing documentation THEN the System SHALL allow expanding/collapsing tag groups
5. WHEN viewing documentation THEN the System SHALL maintain consistent tag naming across all endpoints

### Requirement 9: Example Values

**User Story:** As a developer, I want realistic example values in documentation, so that I can understand expected data formats.

#### Acceptance Criteria

1. WHEN viewing request schemas THEN the System SHALL provide example JSON with realistic values
2. WHEN viewing response schemas THEN the System SHALL provide example JSON for success responses
3. WHEN viewing response schemas THEN the System SHALL provide example JSON for error responses
4. WHEN testing in Swagger UI THEN the System SHALL pre-fill request bodies with example values
5. WHEN viewing examples THEN the System SHALL use consistent formatting and realistic data

### Requirement 10: Auto-Generation from Code

**User Story:** As a developer, I want documentation auto-generated from code comments, so that documentation stays in sync with implementation.

#### Acceptance Criteria

1. WHEN godoc comments are added to handlers THEN the System SHALL generate OpenAPI spec from comments
2. WHEN running `make swagger` THEN the System SHALL regenerate documentation files
3. WHEN documentation is regenerated THEN the System SHALL update swagger.json and swagger.yaml
4. WHEN documentation is regenerated THEN the System SHALL not require manual editing of spec files
5. WHEN code changes THEN the System SHALL reflect changes in documentation after regeneration

### Requirement 11: Export Capabilities

**User Story:** As a developer, I want to export OpenAPI specification, so that I can use it with other tools.

#### Acceptance Criteria

1. WHEN accessing `/swagger/doc.json` THEN the System SHALL return OpenAPI spec in JSON format
2. WHEN accessing documentation files THEN the System SHALL provide swagger.yaml in YAML format
3. WHEN exporting spec THEN the System SHALL include all endpoints, schemas, and security definitions
4. WHEN importing to Postman THEN the System SHALL provide valid OpenAPI 3.0 spec
5. WHEN using with code generators THEN the System SHALL provide complete type information

### Requirement 12: Parameter Documentation

**User Story:** As a developer, I want all parameters documented with types and constraints, so that I can send valid requests.

#### Acceptance Criteria

1. WHEN viewing endpoints with path parameters THEN the System SHALL document parameter name, type, and description
2. WHEN viewing endpoints with query parameters THEN the System SHALL document all query options
3. WHEN viewing endpoints with headers THEN the System SHALL document required headers
4. WHEN viewing parameters THEN the System SHALL show which are required vs optional
5. WHEN viewing parameters THEN the System SHALL show default values when applicable

### Requirement 13: Response Status Codes

**User Story:** As a developer, I want all possible response status codes documented, so that I can handle different scenarios.

#### Acceptance Criteria

1. WHEN viewing any endpoint THEN the System SHALL document 200/201 success responses
2. WHEN viewing any endpoint THEN the System SHALL document 400 validation error responses
3. WHEN viewing protected endpoints THEN the System SHALL document 401 unauthorized responses
4. WHEN viewing protected endpoints THEN the System SHALL document 403 forbidden responses
5. WHEN viewing any endpoint THEN the System SHALL document 500 internal server error responses

### Requirement 14: Consistent Response Format

**User Story:** As a developer, I want consistent response format documented, so that I can parse responses uniformly.

#### Acceptance Criteria

1. WHEN viewing success responses THEN the System SHALL show standard format with success, message, and data fields
2. WHEN viewing error responses THEN the System SHALL show standard format with success and error fields
3. WHEN viewing error details THEN the System SHALL show code, message, and details structure
4. WHEN viewing responses THEN the System SHALL maintain consistent field naming (snake_case)
5. WHEN viewing responses THEN the System SHALL document meta field for pagination when applicable

### Requirement 15: Interactive Testing Support

**User Story:** As a developer, I want to test endpoints directly from documentation, so that I can verify API behavior quickly.

#### Acceptance Criteria

1. WHEN clicking "Try it out" THEN the System SHALL enable request editing
2. WHEN editing request THEN the System SHALL validate JSON syntax
3. WHEN clicking "Execute" THEN the System SHALL send actual HTTP request to server
4. WHEN request completes THEN the System SHALL display response status, headers, and body
5. WHEN testing protected endpoints THEN the System SHALL include authorization headers automatically
