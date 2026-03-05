# 🔧 CORS & Browser Security Fix Guide

## Backend Environment Variables (Render)

Add these to your Render service:

```bash
# Required
FRONTEND_URL=https://chronus-ai.vercel.app
GEMINI_API_KEY=your-gemini-api-key

# OAuth Redirects (use your Render URL)
GOOGLE_REDIRECT_URI=https://chronusai.onrender.com/api/v1/auth/google/callback
MICROSOFT_REDIRECT_URI=https://chronusai.onrender.com/api/v1/auth/outlook/callback

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## Frontend Environment Variables (Vercel)

```bash
VITE_API_URL=https://chronusai.onrender.com/api/v1
```

## OAuth Setup

### Google Cloud Console
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add Authorized redirect URIs:
   ```
   https://chronusai.onrender.com/api/v1/auth/google/callback
   ```
4. Add Authorized JavaScript origins:
   ```
   https://chronus-ai.vercel.app
   https://chronusai.onrender.com
   ```

### Microsoft Azure Portal
1. Go to https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
2. Create new app registration
3. Add Redirect URIs (Web):
   ```
   https://chronusai.onrender.com/api/v1/auth/outlook/callback
   ```
4. Enable "Access tokens" and "ID tokens"

## Browser-Specific Fixes

### Brave Browser
1. Click shield icon in address bar
2. Turn OFF "Block cross-site cookies"
3. Reload page

### Firefox
1. Settings → Privacy & Security
2. Set "Enhanced Tracking Protection" to "Standard"
3. Reload page

### Safari
1. Preferences → Privacy
2. Uncheck "Prevent cross-site tracking"
3. Reload page

## Testing CORS

### Test Backend Health
```bash
curl https://chronusai.onrender.com/health
```

### Test Auth Endpoint
```bash
curl https://chronusai.onrender.com/api/v1/auth/google/login
```

### Test from Frontend
Open browser console on https://chronus-ai.vercel.app:
```javascript
fetch('https://chronusai.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Common Issues & Fixes

### Issue: "CORS policy blocked"
**Fix**: Verify `FRONTEND_URL` in Render matches your Vercel URL exactly

### Issue: "OAuth redirect mismatch"
**Fix**: Ensure redirect URIs in Google/Microsoft console match Render URLs exactly

### Issue: "Network Error" in Brave
**Fix**: Disable Brave Shields for your site

### Issue: "Failed to fetch"
**Fix**: Check if backend is running: `curl https://chronusai.onrender.com/health`

### Issue: "401 Unauthorized"
**Fix**: Clear localStorage and try logging in again

## Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] `FRONTEND_URL` set in Render
- [ ] `VITE_API_URL` set in Vercel
- [ ] Google OAuth redirect URI added
- [ ] Microsoft OAuth redirect URI added
- [ ] CORS origins include Vercel URL
- [ ] Backend health check passes
- [ ] Can access login page
- [ ] OAuth buttons work
- [ ] Can create meetings

## Debug Commands

### Check Environment Variables
```bash
# In Render Shell
echo $FRONTEND_URL
echo $GOOGLE_REDIRECT_URI
```

### Check CORS Headers
```bash
curl -I -X OPTIONS https://chronusai.onrender.com/api/v1/auth/google/login \
  -H "Origin: https://chronus-ai.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

### View Backend Logs
Render Dashboard → Your Service → Logs

### View Frontend Logs
Vercel Dashboard → Your Project → Deployments → View Function Logs

---

If issues persist, check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs in Render
4. Verify all URLs match exactly (no trailing slashes)
