# DigitalOcean Deployment Guide

This guide explains how to deploy the Calendar Scheduler application to DigitalOcean using either **App Platform** (managed) or **Droplets** (self-managed).

## Prerequisites

- DigitalOcean account
- GitHub repository with your code
- Domain name (optional but recommended)
- OAuth credentials from Google and Microsoft (if using calendar integrations)

---

## Option 1: App Platform (Recommended)

App Platform is DigitalOcean's managed platform-as-a-service (PaaS). It handles infrastructure, scaling, and SSL automatically.

### Quick Deploy

1. **Install DigitalOcean CLI (doctl)**
   ```bash
   # macOS
   brew install doctl
   
   # Windows (Scoop)
   scoop install doctl
   
   # Linux
   snap install doctl
   ```

2. **Authenticate doctl**
   ```bash
   doctl auth init
   ```

3. **Update the App Spec**
   
   Edit `do-app-spec.yaml` and replace:
   - `your-username/calendar-scheduler` with your GitHub repo
   - Update `region` if needed (default: `nyc`)

4. **Create the App**
   ```bash
   doctl apps create --spec do-app-spec.yaml
   ```

5. **Configure Secrets**
   
   Go to your app in the DigitalOcean dashboard and add the following secrets:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `JWT_SECRET_KEY` (generate with: `openssl rand -hex 32`)
   - `ENCRYPTION_KEY` (generate with: `openssl rand -hex 32`)
   - `SECRET_KEY` (generate with: `openssl rand -hex 32`)
   - `OPENAI_API_KEY`

6. **Deploy**
   
   Push to your main branch - App Platform will automatically deploy.

### Update Existing App

```bash
# Get your app ID
doctl apps list

# Update the app
doctl apps update <app-id> --spec do-app-spec.yaml
```

### Custom Domain

1. Go to your app settings in DigitalOcean dashboard
2. Click "Add Domain"
3. Add your domain and follow DNS instructions
4. Update your OAuth redirect URIs accordingly

---

## Option 2: Droplet Deployment

For more control, deploy to a DigitalOcean Droplet with Docker.

### Create a Droplet

1. **Create Ubuntu Droplet**
   - Image: Ubuntu 22.04 LTS
   - Size: Basic ($6/mo minimum, $12/mo recommended)
   - Region: Choose closest to your users
   - Enable backups (recommended)

2. **Initial Server Setup**
   ```bash
   # SSH into your droplet
   ssh root@your-droplet-ip
   
   # Create a non-root user
   adduser deploy
   usermod -aG sudo deploy
   
   # Set up SSH for new user
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
   
   # Set up firewall
   ufw allow OpenSSH
   ufw allow 80
   ufw allow 443
   ufw enable
   
   # Exit and reconnect as deploy user
   exit
   ssh deploy@your-droplet-ip
   ```

3. **Clone Your Repository**
   ```bash
   git clone https://github.com/your-username/calendar-scheduler.git
   cd calendar-scheduler/deployment/digitalocean
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

5. **Run Deployment Script**
   ```bash
   chmod +x deploy-droplet.sh
   ./deploy-droplet.sh
   ```

### DNS Configuration

Point your domain to your Droplet's IP address:
- A record: `@` → `your-droplet-ip`
- A record: `www` → `your-droplet-ip`

### Managing Your Deployment

```bash
cd ~/calendar-scheduler/deployment/digitalocean

# View logs
docker-compose -f do-droplet-compose.yml logs -f

# View specific service logs
docker-compose -f do-droplet-compose.yml logs -f backend

# Restart services
docker-compose -f do-droplet-compose.yml restart

# Stop all services
docker-compose -f do-droplet-compose.yml down

# Update and redeploy
git pull
docker-compose -f do-droplet-compose.yml up -d --build
```

### SSL Certificate Renewal

Certificates auto-renew via the certbot container. To manually renew:
```bash
docker-compose -f do-droplet-compose.yml exec certbot certbot renew
```

---

## Option 3: Managed Database + Droplet

For better database reliability, use DigitalOcean Managed PostgreSQL:

1. **Create Managed Database**
   - Go to Databases in DigitalOcean dashboard
   - Create PostgreSQL 15 cluster
   - Choose region matching your Droplet

2. **Update docker-compose**
   
   Remove the `postgres` service and update `DATABASE_URL`:
   ```yaml
   environment:
     DATABASE_URL: ${DATABASE_URL}  # From managed database connection string
   ```

3. **Set DATABASE_URL in .env**
   ```
   DATABASE_URL=postgresql+asyncpg://user:password@host:port/database?sslmode=require
   ```

---

## Monitoring & Alerts

### App Platform Monitoring

App Platform includes basic monitoring. Enable alerts in your app settings for:
- Deployment failures
- High CPU/Memory usage
- Domain SSL issues

### Droplet Monitoring

Install DigitalOcean monitoring agent:
```bash
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

---

## Cost Estimates

### App Platform
| Component | Size | Monthly Cost |
|-----------|------|--------------|
| Backend | basic-xxs | ~$5 |
| Frontend | basic-xxs | ~$5 |
| PostgreSQL | db-s-dev | ~$7 |
| **Total** | | **~$17/month** |

### Droplet
| Component | Size | Monthly Cost |
|-----------|------|--------------|
| Droplet | s-1vcpu-1gb | $6 |
| Droplet | s-1vcpu-2gb | $12 |
| Managed DB (optional) | | $15+ |

---

## Troubleshooting

### App Platform

**Deployment fails:**
```bash
doctl apps logs <app-id> --type=deploy
```

**App crashes:**
```bash
doctl apps logs <app-id> --type=run
```

### Droplet

**Container not starting:**
```bash
docker-compose -f do-droplet-compose.yml logs backend
```

**Database connection issues:**
```bash
docker-compose -f do-droplet-compose.yml exec backend python -c "from app.db.session import engine; print('DB OK')"
```

**SSL certificate issues:**
```bash
# Check certificate status
docker-compose -f do-droplet-compose.yml exec certbot certbot certificates

# Force renewal
docker-compose -f do-droplet-compose.yml exec certbot certbot renew --force-renewal
```

---

## Security Recommendations

1. **Enable 2FA** on your DigitalOcean account
2. **Use SSH keys** instead of passwords
3. **Keep secrets** out of version control
4. **Enable automatic updates** on Droplets:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```
5. **Regular backups** - enable Droplet backups or database backups
6. **Monitor logs** for suspicious activity

---

## Support

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Community Tutorials](https://www.digitalocean.com/community/tutorials)
