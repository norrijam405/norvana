> **Recovery notice (2026-09-26):** This is historical deployment lineage, not proof of a current live deployment. Historical credentials must not be reused. The browser-password Engine Room is disabled on the modernization branch.\n\n# 🚀 NORVANA Deployment to IONOS

This guide walks you through deploying your NORVANA store to your IONOS account.

## 📋 IONOS Hosting Options

IONOS offers several options for hosting Next.js applications:

| Option | Best For | Server-Side Rendering | Price |
|--------|----------|----------------------|-------|
| **VPS (Recommended)** | Full Next.js with SSR, API routes, database | ✅ Yes | ~$2-10/mo |
| **Cloud Server** | High-traffic, scalable apps | ✅ Yes | ~$10+/mo |
| **Deploy Now (Static)** | Static exports only | ❌ No | Free-$5/mo |

**For NORVANA, you need a VPS or Cloud Server** because we use:
- Server-side rendering
- API routes (`/api/*`)
- PostgreSQL database

---

## 🔧 Option 1: IONOS VPS Deployment (Recommended)

### Step 1: Purchase IONOS VPS

1. Go to [IONOS VPS](https://www.ionos.com/servers/vps)
2. Choose **VPS Linux** (Ubuntu 22.04 or 24.04)
3. Minimum specs: **1 vCPU, 2GB RAM, 20GB SSD** (~$6/mo)
4. Complete purchase and note your server IP address

### Step 2: Point Your Domain

1. In IONOS Control Panel → **Domains & SSL**
2. Select your domain
3. Go to **DNS Settings**
4. Add/Edit **A Record**:
   - Host: `@`
   - Points to: `YOUR_VPS_IP`
5. Add another A Record for www:
   - Host: `www`
   - Points to: `YOUR_VPS_IP`

### Step 3: Connect to Your VPS via SSH

```bash
# From your local terminal
ssh root@YOUR_VPS_IP

# Or with a specific SSH key
ssh -i ~/.ssh/your_key root@YOUR_VPS_IP
```

### Step 4: Initial Server Setup

Run these commands on your VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 5: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER norvana WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE norvana_db OWNER norvana;
GRANT ALL PRIVILEGES ON DATABASE norvana_db TO norvana;
\q
EOF

# Test connection
psql -h localhost -U norvana -d norvana_db
```

### Step 6: Deploy Your Application

```bash
# Create app directory
sudo mkdir -p /var/www/norvana
sudo chown $USER:$USER /var/www/norvana
cd /var/www/norvana

# Clone your repository (or upload files)
git clone https://github.com/YOUR_USERNAME/norvana.git .

# Or use SCP to upload from your local machine:
# scp -r /path/to/norvana/* root@YOUR_VPS_IP:/var/www/norvana/

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
DATABASE_URL=postgresql://norvana:your_secure_password_here@localhost:5432/norvana_db
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
NODE_ENV=production
EOF

# Build the application
npm run build

# Push database schema
npx drizzle-kit push

# Seed the database (optional)
curl -X POST http://localhost:3000/api/seed
```

### Step 7: Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'norvana',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/norvana',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
EOF

# Start the app with PM2
pm2 start ecosystem.config.js

# Save PM2 process list and configure startup
pm2 save
pm2 startup systemd
# Run the command it outputs

# Check status
pm2 status
pm2 logs norvana
```

### Step 8: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/norvana
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/norvana /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 9: Enable SSL (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Auto-renewal is set up automatically. Test it:
sudo certbot renew --dry-run
```

### Step 10: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** and add to your `.env` file

---

## 🔄 Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to IONOS VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/norvana
            git pull origin main
            npm install
            npm run build
            npx drizzle-kit push
            pm2 restart norvana
```

Add these secrets to your GitHub repository (Settings → Secrets → Actions):
- `VPS_HOST`: Your IONOS VPS IP address
- `VPS_USER`: `root` (or your SSH user)
- `VPS_SSH_KEY`: Your private SSH key

---

## 📊 Monitoring & Maintenance

### View Application Logs
```bash
pm2 logs norvana
pm2 logs norvana --lines 100
```

### Restart Application
```bash
pm2 restart norvana
```

### Check Server Resources
```bash
htop
df -h
free -m
```

### Database Backup
```bash
# Backup
pg_dump -U norvana norvana_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U norvana norvana_db < backup.sql
```

### Update SSL Certificate
```bash
sudo certbot renew
```

---

## 🔗 Quick Reference

| Service | URL |
|---------|-----|
| Store | https://yourdomain.com |
| Admin Panel | https://yourdomain.com/admin |
| API Health | https://yourdomain.com/api/health |
| Stripe Webhook | https://yourdomain.com/api/webhooks/stripe |

| Credentials | Value |
|-------------|-------|
| Admin access | Disabled during recovery; rebuild with server-side identity/session |
| Database | `norvana_db` |
| Database User | `norvana` |

---

## ❓ Troubleshooting

### App won't start
```bash
pm2 logs norvana --err
cat /var/www/norvana/.next/trace
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U norvana -d norvana_db -c "SELECT 1"
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## 💰 Estimated Monthly Costs

| Service | Cost |
|---------|------|
| IONOS VPS (2GB RAM) | ~$6/mo |
| Domain (if purchasing) | ~$12/year |
| SSL Certificate | FREE (Let's Encrypt) |
| **Total** | **~$7/mo** |

---

Need help? Contact: Norrisjamesdata@gmail.com
