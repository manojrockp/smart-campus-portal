#!/bin/bash

echo "🚀 Setting up Smart Campus Portal on Ubuntu Server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Clone your repository
git clone https://github.com/yourusername/smart-campus-portal.git
cd smart-campus-portal

# Create production environment
cp .env.production.example .env.production

echo "✅ Server setup complete!"
echo "📝 Next steps:"
echo "1. Edit .env.production with your settings"
echo "2. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "3. Your app will be available at http://your-server-ip"