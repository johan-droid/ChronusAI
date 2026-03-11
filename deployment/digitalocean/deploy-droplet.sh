#!/bin/bash
# DigitalOcean Droplet Deployment Script
# Run this on your Droplet after initial setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Calendar Scheduler - Droplet Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run as root. Use a user with sudo privileges.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Copy .env.example to .env and fill in your values.${NC}"
    exit 1
fi

# Load environment variables
source .env

# Verify required variables
required_vars=("DOMAIN" "POSTGRES_PASSWORD" "JWT_SECRET_KEY" "ENCRYPTION_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Step 1: Installing Docker if not present...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed. Please log out and back in, then run this script again.${NC}"
    exit 0
fi

echo -e "${YELLOW}Step 2: Installing Docker Compose if not present...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo -e "${YELLOW}Step 3: Creating SSL certificate directories...${NC}"
mkdir -p certbot/conf certbot/www

echo -e "${YELLOW}Step 4: Obtaining initial SSL certificate...${NC}"
if [ ! -d "certbot/conf/live/${DOMAIN}" ]; then
    # Create temporary nginx config for certbot
    cat > nginx-temp.conf << 'EOF'
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name _;
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 200 'OK'; }
    }
}
EOF
    
    # Start temporary nginx
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v $(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
        -v $(pwd)/certbot/www:/var/www/certbot \
        nginx:alpine
    
    sleep 5
    
    # Get certificate
    docker run --rm \
        -v $(pwd)/certbot/conf:/etc/letsencrypt \
        -v $(pwd)/certbot/www:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@${DOMAIN} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN}
    
    # Stop temporary nginx
    docker stop nginx-temp
    docker rm nginx-temp
    rm nginx-temp.conf
    
    echo -e "${GREEN}SSL certificate obtained!${NC}"
else
    echo -e "${GREEN}SSL certificate already exists.${NC}"
fi

echo -e "${YELLOW}Step 5: Updating nginx config with domain...${NC}"
sed -i "s/\${DOMAIN}/${DOMAIN}/g" nginx-proxy.conf

echo -e "${YELLOW}Step 6: Building and starting containers...${NC}"
docker-compose -f do-droplet-compose.yml up -d --build

echo -e "${YELLOW}Step 7: Waiting for services to start...${NC}"
sleep 30

echo -e "${YELLOW}Step 8: Checking service health...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health | grep -q "200"; then
    echo -e "${GREEN}Backend is healthy!${NC}"
else
    echo -e "${RED}Backend health check failed. Check logs with: docker-compose logs backend${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your app should be available at: ${GREEN}https://${DOMAIN}${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  View logs:    ${YELLOW}docker-compose -f do-droplet-compose.yml logs -f${NC}"
echo -e "  Restart:      ${YELLOW}docker-compose -f do-droplet-compose.yml restart${NC}"
echo -e "  Stop:         ${YELLOW}docker-compose -f do-droplet-compose.yml down${NC}"
echo -e "  Update:       ${YELLOW}git pull && docker-compose -f do-droplet-compose.yml up -d --build${NC}"
