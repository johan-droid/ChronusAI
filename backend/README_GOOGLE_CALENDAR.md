# Google Calendar Integration for ChronosAI

This document provides comprehensive information about the Google Calendar API integration in ChronosAI.

## Overview

ChronosAI integrates with Google Calendar API v3 to provide:
- **OAuth Authentication** - Secure Google authentication flow
- **Calendar Management** - List, create, update, and delete events
- **Availability Checking** - Find free time slots for scheduling
- **Free/Busy Information** - Check availability across multiple calendars
- **Real-time Sync** - Automatic token refresh and event synchronization

## Architecture

### Components

1. **OAuth Provider** (`app/core/oauth.py`)
   - Handles Google OAuth 2.0 flow
   - Token exchange and refresh
   - Scope management

2. **Calendar Service** (`app/services/google_calendar_service.py`)
   - Google Calendar API v3 integration
   - Token management and refresh
   - Event operations

3. **Unified Service** (`app/services/calendar_integration_service.py`)
   - Multi-provider support (Google & Outlook)
   - Consistent API across providers
   - Error handling and logging

4. **API Endpoints** (`app/api/v1/calendar.py`)
   - RESTful endpoints for calendar operations
   - Authentication and authorization
   - Request validation and response formatting

### Data Flow

```
Frontend → OAuth → Google API → Backend Service → Database
    ↓           ↓          ↓           ↓           ↓
Login → Token → API Call → Event → Store → Response
```

## Features

### Authentication
- **OAuth 2.0 Flow** - Secure authentication with PKCE support
- **Token Management** - Automatic refresh and secure storage
- **Scope Management** - Required calendar permissions
- **Session Management** - JWT tokens with refresh capability

### Calendar Operations
- **List Calendars** - Get all user calendars
- **Get Events** - Fetch events with date filtering
- **Create Events** - Create new calendar events
- **Update Events** - Modify existing events
- **Delete Events** - Remove calendar events

### Availability Features
- **Free/Busy Query** - Check availability across calendars
- **Time Slot Generation** - Find available time slots
- **Conflict Detection** - Identify scheduling conflicts
- **Duration Support** - Flexible meeting durations

## API Endpoints

### Authentication
```
GET  /api/v1/auth/google/login     - Initiate OAuth flow
GET  /api/v1/auth/google/callback  - OAuth callback
POST /api/v1/auth/refresh          - Refresh access token
POST /api/v1/auth/logout           - Logout and revoke tokens
```

### Calendar Operations
```
GET  /api/v1/calendar/test-connection - Test API connection
GET  /api/v1/calendar/calendars       - List user calendars
GET  /api/v1/calendar/events          - Get calendar events
POST /api/v1/calendar/events          - Create new event
PUT  /api/v1/calendar/events/{id}     - Update existing event
DELETE /api/v1/calendar/events/{id}   - Delete event
```

### Availability
```
GET /api/v1/calendar/availability     - Get available time slots
GET /api/v1/calendar/free-busy        - Get free/busy information
```

## Configuration

### Environment Variables

```env
# Google OAuth & Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# App Configuration
FRONTEND_URL=http://localhost:5173
JWT_SECRET_KEY=your-jwt-secret
ENCRYPTION_KEY=your-fernet-key
```

### Required Scopes

```
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

## Setup Guide

### 1. Google Cloud Console Setup

See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for detailed instructions.

### 2. Backend Configuration

```bash
# Install dependencies
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

# Run setup script
python setup_google_oauth.py

# Test integration
python test_calendar_integration.py
```

### 3. Frontend Integration

The frontend should:
1. Redirect users to `/api/v1/auth/google/login`
2. Handle OAuth callback with tokens
3. Store JWT tokens for API calls
4. Include `Authorization: Bearer <token>` header

## Usage Examples

### Test Connection

```python
from app.services.calendar_integration_service import create_calendar_service

service = create_calendar_service(user_id, "google", db_session)
result = await service.test_connection()
```

### Get Available Slots

```python
from datetime import datetime, timedelta

start_time = datetime.now()
end_time = start_time + timedelta(days=7)
result = await service.get_availability(
    start_time=start_time,
    end_time=end_time,
    duration_minutes=30
)
```

### Create Event

```python
event_data = {
    "title": "Team Meeting",
    "description": "Weekly team sync",
    "start_time": datetime.now() + timedelta(hours=1),
    "end_time": datetime.now() + timedelta(hours=2),
    "location": "Conference Room A",
    "attendees": [{"email": "team@example.com"}]
}

event = await service.create_event(event_data)
```

## Error Handling

### Common Errors

1. **`redirect_uri_mismatch`**
   - Check redirect URI in Google Console
   - Ensure exact match with backend URL

2. **`invalid_client`**
   - Verify Client ID and Secret
   - Check if OAuth client is enabled

3. **`access_denied`**
   - User denied permission
   - Check required scopes

4. **`token_expired`**
   - Automatic refresh should handle this
   - Check refresh token storage

### Logging

All calendar operations are logged with structured logging:

```python
logger.info("calendar_operation", 
           operation="create_event",
           user_id=user_id,
           event_id=event_id)
```

## Security

### Token Storage
- **Encryption** - All OAuth tokens are encrypted at rest
- **Database Storage** - Encrypted tokens stored in database
- **Memory Cache** - Tokens cached in memory with expiry

### Token Refresh
- **Automatic Refresh** - Tokens refreshed before expiry
- **Background Refresh** - Refresh happens without user intervention
- **Error Handling** - Failed refresh triggers re-authentication

### Scope Validation
- **Minimum Scopes** - Required for calendar operations
- **Scope Verification** - Tokens validated for required scopes
- **User Consent** - Explicit consent for calendar access

## Testing

### Unit Tests
```bash
pytest tests/test_calendar_service.py
```

### Integration Tests
```bash
python test_calendar_integration.py
```

### Manual Testing
1. Visit `/api/docs` for interactive API documentation
2. Test OAuth flow through frontend
3. Verify calendar operations work correctly

## Monitoring

### API Usage
- Monitor Google API quota usage
- Track error rates and response times
- Set up alerts for API failures

### Performance
- Cache calendar data where appropriate
- Implement rate limiting for API calls
- Optimize database queries

## Troubleshooting

### Debug Mode
Enable debug logging:
```python
import structlog
structlog.configure(processors=[structlog.dev.ConsoleRenderer()])
```

### Common Issues

1. **CORS Errors**
   - Check CORS configuration
   - Verify frontend URL in settings

2. **Database Errors**
   - Check database connection
   - Verify OAuth credentials table

3. **API Rate Limits**
   - Monitor Google API usage
   - Implement exponential backoff

## Production Considerations

### Scalability
- **Connection Pooling** - Reuse HTTP connections
- **Caching** - Cache calendar data
- **Batch Operations** - Process events in batches

### Reliability
- **Retry Logic** - Implement retry for failed requests
- **Circuit Breaker** - Prevent cascade failures
- **Health Checks** - Monitor API connectivity

### Compliance
- **Data Privacy** - Comply with GDPR/CCPA
- **Audit Logs** - Log all calendar operations
- **Data Retention** - Implement data retention policies

## API Reference

### CalendarEvent Schema
```python
{
    "id": "string",
    "summary": "string",
    "description": "string",
    "start": "datetime",
    "end": "datetime",
    "location": "string",
    "status": "confirmed",
    "attendees": [{"email": "string"}],
    "created": "datetime",
    "updated": "datetime"
}
```

### TimeSlot Schema
```python
{
    "start": "datetime",
    "end": "datetime",
    "duration_minutes": "integer",
    "is_available": "boolean"
}
```

## Support

For additional help:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [ChronosAI Documentation](README.md)
- [Issue Tracker](https://github.com/your-repo/issues)
