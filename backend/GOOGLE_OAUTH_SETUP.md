# Google OAuth & Calendar API Setup Guide

This guide will help you set up Google OAuth authentication and Google Calendar API integration for ChronosAI.

## Prerequisites

- Google Cloud Console account
- Domain for production (optional for development)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown and select "NEW PROJECT"
3. Enter a project name (e.g., "ChronosAI")
4. Click "CREATE"

## Step 2: Enable APIs

1. In your project dashboard, go to "APIs & Services" → "Library"
2. Search and enable the following APIs:
   - **Google Calendar API**
   - **OAuth2 API** (usually enabled by default)

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose **External** for User Type
3. Fill in the required fields:
   - **App name**: ChronosAI
   - **User support email**: your email
   - **Developer contact information**: your email
4. Click "SAVE AND CONTINUE"

### Scopes Configuration
Add the following scopes:
```
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### Test Users (Development Only)
Add your test email addresses for development before publishing the app.

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Select **Web application** as Application type
4. Configure:
   - **Name**: ChronosAI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://your-frontend-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/v1/auth/google/callback` (development)
     - `https://your-backend-domain.com/api/v1/auth/google/callback` (production)

5. Click "CREATE"
6. **Save your Client ID and Client Secret** - you'll need these for the backend

## Step 5: Backend Configuration

Update your `.env` file with the Google OAuth credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

## Step 6: Install Dependencies

Install the required Google API libraries:

```bash
cd backend
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

## Step 7: Test the Integration

1. Start your backend server:
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. Start your frontend server:
```bash
cd frontend
npm run dev
```

3. Navigate to `http://localhost:5173`
4. Click "Continue with Google"
5. Complete the OAuth flow
6. Test calendar integration by visiting the API docs at `http://localhost:8000/api/docs`

## API Endpoints

### Authentication
- `GET /api/v1/auth/google/login` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - OAuth callback

### Calendar Operations
- `GET /api/v1/calendar/test-connection` - Test Google Calendar connection
- `GET /api/v1/calendar/calendars` - List user's calendars
- `GET /api/v1/calendar/events` - Get calendar events
- `GET /api/v1/calendar/availability` - Get available time slots
- `GET /api/v1/calendar/free-busy` - Get free/busy information
- `POST /api/v1/calendar/events` - Create new event
- `PUT /api/v1/calendar/events/{event_id}` - Update existing event
- `DELETE /api/v1/calendar/events/{event_id}` - Delete event

## Production Setup

### Domain Configuration
For production, update your OAuth client with:
- Your actual domain URLs
- HTTPS redirect URIs (required for production)

### Environment Variables
```env
# Production
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/v1/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com
```

### Security Considerations
1. Store credentials securely (use environment variables)
2. Enable app verification for production
3. Implement proper rate limiting
4. Monitor API usage and errors

## Troubleshooting

### Common Issues

**"redirect_uri_mismatch" Error**
- Verify the redirect URI in Google Console matches your backend URL
- Check for trailing slashes and protocol (http vs https)

**"invalid_client" Error**
- Verify your Client ID and Client Secret are correct
- Ensure the OAuth client is not deleted or disabled

**"access_denied" Error**
- Verify the user has granted the required scopes
- Check if the app is published (for production users)

**Calendar API Errors**
- Verify Google Calendar API is enabled
- Check if the user has calendar permissions
- Ensure tokens are properly refreshed

### Debug Mode
Add logging to debug OAuth flow:
```python
import structlog
logger = structlog.get_logger()

# In your OAuth callback
logger.info("oauth_callback", provider=provider, code_length=len(code))
```

## API Usage Examples

### Test Connection
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8000/api/v1/calendar/test-connection
```

### Get Events
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:8000/api/v1/calendar/events?start_time=2024-01-01T00:00:00Z&end_time=2024-01-31T23:59:59Z"
```

### Create Event
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Team Meeting",
       "description": "Weekly team sync",
       "start_time": "2024-01-15T10:00:00Z",
       "end_time": "2024-01-15T11:00:00Z",
       "attendees": [{"email": "team@example.com"}]
     }' \
     http://localhost:8000/api/v1/calendar/events
```

## Next Steps

1. Set up automated token refresh
2. Implement webhook notifications for calendar changes
3. Add calendar sharing and collaboration features
4. Set up monitoring and logging for API usage
5. Implement rate limiting and quota management

## Support

For additional help:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google Cloud Console Help](https://cloud.google.com/docs/get-started)
