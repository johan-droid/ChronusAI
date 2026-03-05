# 🚀 ChronosAI Deployment Guide

## Backend Deployment (Render.com)

### Step 1: Prepare Repository
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository
5. Render will detect `backend/render.yaml`
6. Click **"Apply"**

### Step 3: Set Environment Variables

In Render Dashboard, go to your service and add:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/api/v1/auth/google/callback
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=https://your-app.onrender.com/api/v1/auth/outlook/callback
FRONTEND_URL=https://your-app.vercel.app
```

### Step 4: Wait for Deployment
- Database: ~2 minutes
- Redis: ~1 minute
- Backend API: ~5 minutes

### Step 5: Verify Deployment
```bash
curl https://your-app.onrender.com/health
```

---

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### Step 2: Deploy via GitHub (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variable

Add in Vercel Dashboard:
```bash
VITE_API_URL=https://your-app.onrender.com/api/v1
```

### Step 4: Deploy
Click **"Deploy"** - takes ~2 minutes

### Alternative: Deploy via CLI
```bash
cd frontend
vercel
# Follow prompts
vercel --prod
```

---

## Post-Deployment Checklist

### ✅ Backend
- [ ] Health check returns 200: `https://your-app.onrender.com/health`
- [ ] API docs accessible: `https://your-app.onrender.com/api/docs`
- [ ] Database connected (check logs)
- [ ] Redis connected (check logs)

### ✅ Frontend
- [ ] Site loads: `https://your-app.vercel.app`
- [ ] No console errors
- [ ] Can reach login page
- [ ] API calls work (check Network tab)

### ✅ Integration
- [ ] OAuth redirects work
- [ ] Can create meetings
- [ ] Can view meetings
- [ ] Real-time updates work

---

## Environment Variables Reference

### Backend (Render)
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | ⚠️ | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | Google OAuth (optional) |
| `GOOGLE_REDIRECT_URI` | ⚠️ | Google OAuth callback |
| `MICROSOFT_CLIENT_ID` | ⚠️ | Microsoft OAuth (optional) |
| `MICROSOFT_CLIENT_SECRET` | ⚠️ | Microsoft OAuth (optional) |
| `MICROSOFT_REDIRECT_URI` | ⚠️ | Microsoft OAuth callback |
| `FRONTEND_URL` | ✅ | Your Vercel URL |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Your Render backend URL + /api/v1 |

---

## Troubleshooting

### Backend Issues

**Problem**: Service won't start
```bash
# Check logs in Render Dashboard
# Common issues:
# - Missing environment variables
# - Database connection failed
# - Redis connection failed
```

**Problem**: Database migrations failed
```bash
# SSH into Render service (Shell tab)
alembic upgrade head
```

**Problem**: 502 Bad Gateway
```bash
# Check if service is running
# Verify PORT environment variable is set
# Check health endpoint
```

### Frontend Issues

**Problem**: API calls fail (CORS)
```bash
# Verify FRONTEND_URL in backend matches Vercel URL
# Check browser console for CORS errors
```

**Problem**: Environment variable not working
```bash
# Redeploy after adding env vars
vercel --prod
```

**Problem**: 404 on refresh
```bash
# Verify vercel.json routing is correct
# Should redirect all routes to index.html
```

---

## Monitoring

### Render
- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Shell**: Dashboard → Service → Shell

### Vercel
- **Deployments**: Dashboard → Project → Deployments
- **Logs**: Click on deployment → View Function Logs
- **Analytics**: Dashboard → Project → Analytics

---

## Updating

### Backend
```bash
git push origin main
# Render auto-deploys
```

### Frontend
```bash
git push origin main
# Vercel auto-deploys
```

---

## Custom Domains

### Render
1. Dashboard → Service → Settings
2. Add custom domain
3. Update DNS records

### Vercel
1. Dashboard → Project → Settings → Domains
2. Add domain
3. Update DNS records

---

## Scaling

### Render
- Upgrade plan for more resources
- Add more workers in start command
- Enable autoscaling (paid plans)

### Vercel
- Automatic scaling included
- No configuration needed

---

Built with ❤️ by the ChronosAI team
