#!/bin/bash

# NORVANA Export Script for IONOS Deployment
# This script prepares your project for deployment

echo "🚀 NORVANA Export Script"
echo "========================"

# Create deployment package
echo "📦 Creating deployment package..."

# Remove node_modules and .next to reduce size
rm -rf node_modules .next

# Create tarball
tar -czf norvana-deploy.tar.gz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.log' \
  .

echo "✅ Created: norvana-deploy.tar.gz"
echo ""
echo "📋 Next Steps:"
echo "1. Download norvana-deploy.tar.gz"
echo "2. Upload to your IONOS VPS:"
echo "   scp norvana-deploy.tar.gz root@YOUR_VPS_IP:/var/www/"
echo ""
echo "3. On your VPS, extract and setup:"
echo "   cd /var/www"
echo "   tar -xzf norvana-deploy.tar.gz -C norvana"
echo "   cd norvana"
echo "   npm install"
echo "   npm run build"
echo ""
echo "📖 Full instructions: See IONOS-DEPLOYMENT.md"
