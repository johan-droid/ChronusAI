# ChronosAI Security Implementation

## 🔒 Authentication & Authorization

### Multi-Layer Security Architecture

ChronosAI implements enterprise-grade security with multiple layers of protection:

## 1. OAuth 2.0 Authentication

### Provider Integration
- **Google OAuth 2.0**: Full implementation with email verification
- **Microsoft OAuth 2.0**: Azure AD integration
- **State Parameter**: CSRF protection with 32-byte random tokens
- **Token Encryption**: All OAuth tokens encrypted at rest using Fernet (AES-128)

### Security Features
- ✅ Email verification required for Google accounts
- ✅ State parameter validation (CSRF protection)
- ✅ Authorization code validation (minimum length checks)
- ✅ Token format validation
- ✅ Secure token storage with encryption
- ✅ Automatic token refresh before expiry

## 2. JWT Token Security

### Access Tokens
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiry**: 60 minutes (configurable)
- **Claims**: 
  - `sub`: User ID
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
  - `jti`: Unique token ID (32-byte random)
  - `type`: Token type ("access")

### Refresh Tokens
- **Expiry**: 7 days
- **Session Tracking**: In-memory session store (Redis recommended for production)
- **Revocation**: Individual and bulk session revocation supported
- **Claims**: Same as access tokens with `type: "refresh"`

## 3. Middleware Protection

### SecurityValidationMiddleware
Validates ALL requests to protected endpoints:
- ✅ Requires Bearer token for protected routes
- ✅ Validates token format (minimum 20 characters)
- ✅ Verifies JWT signature and structure
- ✅ Checks token type (access vs refresh)
- ✅ Returns 401 for invalid/missing tokens

### TokenRefreshMiddleware
Automatic token refresh:
- ✅ Refreshes OAuth tokens 5 minutes before expiry
- ✅ Updates encrypted tokens in database
- ✅ Provides fresh tokens to request handlers
- ✅ Graceful failure handling

## 4. Protected Routes

All API endpoints requiring authentication:
```
/api/v1/users/*
/api/v1/meetings/*
/api/v1/chat/*
/api/v1/availability/*
```

## 5. Frontend Security

### Login Flow
1. **Pre-Authentication Cleanup**
   - Clears all auth state
   - Clears session storage
   - Clears cache

2. **OAuth Initiation**
   - Validates state parameter (32+ bytes)
   - Stores state, provider, and timestamp
   - Redirects to OAuth provider

3. **Callback Handling**
   - Validates tokens from URL
   - Clears URL immediately (security)
   - Fetches user data from backend
   - Validates user data completeness
   - Only sets auth on successful validation

4. **Protected Routes**
   - All routes check `isAuthenticated` state
   - Redirects to login if not authenticated
   - Clears OAuth remnants on redirect

### API Client Security
- ✅ Automatic token injection in headers
- ✅ Token refresh on 401 responses
- ✅ Automatic logout on refresh failure
- ✅ Request/response interceptors
- ✅ 30-second timeout on all requests

## 6. Session Management

### Active Session Tracking
- Each refresh token has unique JTI
- Sessions stored with metadata:
  - User ID
  - Created timestamp
  - Last used timestamp
- Automatic cleanup of expired sessions

### Logout Options
1. **Single Device Logout**
   - Revokes current refresh token
   - Revokes OAuth tokens with provider
   - Returns provider logout URL

2. **All Devices Logout**
   - Revokes all user sessions
   - Revokes all OAuth tokens
   - Broadcasts logout to all tabs

## 7. Data Protection

### Encryption
- **OAuth Tokens**: Fernet encryption (AES-128)
- **Encryption Key**: 32-byte key from environment
- **At Rest**: All tokens encrypted in database
- **In Transit**: HTTPS only in production

### Privacy
- **User IDs**: Hashed for logging (SHA-256)
- **Emails**: Masked in logs (e.g., j***n@example.com)
- **PII**: Never logged in plaintext

## 8. Rate Limiting

- **SlowAPI**: Request rate limiting
- **429 Responses**: Rate limit exceeded
- **Per-endpoint limits**: Configurable

## 9. CORS Configuration

### Allowed Origins
- Frontend URL from environment
- Localhost for development
- Vercel deployment URL

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS, PATCH

### Credentials
- ✅ Credentials allowed for cookie/auth headers

## 10. Error Handling

### Security-First Errors
- ❌ No sensitive data in error messages
- ❌ No stack traces in production
- ✅ Generic "Authentication failed" messages
- ✅ Detailed logging server-side only

## 11. Validation

### Input Validation
- ✅ Provider validation (google/outlook only)
- ✅ State parameter validation (32+ bytes)
- ✅ Authorization code validation (10+ chars)
- ✅ Token format validation (20+ chars)
- ✅ Email format validation
- ✅ Email verification check (Google)

### Token Validation
- ✅ JWT signature verification
- ✅ Expiration check
- ✅ Token type check
- ✅ User existence check
- ✅ Session validity check

## 12. Audit Logging

### Structured Logging
All security events logged with:
- Timestamp (ISO format)
- User ID (hashed)
- Email (masked)
- Provider
- Action type
- Result (success/failure)

### Logged Events
- User authentication
- New user creation
- Token refresh
- Logout (single/all devices)
- Account deletion
- OAuth failures
- Token validation failures

## Security Best Practices

### ✅ Implemented
- OAuth 2.0 with state parameter
- JWT with short expiry
- Token encryption at rest
- Automatic token refresh
- Session tracking and revocation
- Multi-layer middleware protection
- Input validation
- Rate limiting
- CORS configuration
- Structured audit logging
- Error message sanitization
- PII masking

### 🔄 Recommended for Production
- [ ] Redis for session storage
- [ ] Rate limiting per user
- [ ] IP-based rate limiting
- [ ] Anomaly detection
- [ ] 2FA/MFA support
- [ ] Security headers (Helmet.js)
- [ ] Content Security Policy
- [ ] HTTPS enforcement
- [ ] Certificate pinning
- [ ] Regular security audits

## Environment Variables

Required for security:
```env
SECRET_KEY=<strong-random-key>
ENCRYPTION_KEY=<32-byte-fernet-key>
JWT_SECRET_KEY=<strong-random-key>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
MICROSOFT_CLIENT_ID=<microsoft-oauth-client-id>
MICROSOFT_CLIENT_SECRET=<microsoft-oauth-secret>
```

## Compliance

- ✅ **SOC 2 Ready**: Audit logging, encryption, access controls
- ✅ **GDPR Compliant**: Data deletion, user consent, data portability
- ✅ **OAuth 2.0 Standard**: RFC 6749 compliant
- ✅ **JWT Best Practices**: RFC 7519 compliant

## Security Contact

For security issues, please contact: [security@chronusai.com](mailto:security@chronusai.com)

---

**Last Updated**: 2024
**Version**: 1.0.0
