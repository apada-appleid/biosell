# Deployment Guide for Shopgram Front on CentOS with WHM

This guide outlines the steps to deploy your Next.js application on a CentOS server with WHM, ensuring it runs on a specific port permanently.

## Prerequisites

- CentOS server with WHM/cPanel access
- Root or sudo access
- Node.js and Yarn installed on the server
- Git installed on the server

## Installation Steps

### 1. Install Node.js and Yarn (if not already installed)

```bash
# Install Node.js using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20 # Install Node.js 20 (or your required version)

# Install Yarn
npm install -g yarn
```

### 2. Clone the Repository

```bash
mkdir -p /var/www/html
cd /var/www/html
git clone <your-repository-url> shopgram-front
cd shopgram-front
```

### 3. Install Dependencies and Build

```bash
yarn install --frozen-lockfile
yarn build
```

### 4. Install PM2 Process Manager

```bash
npm install -g pm2
```

### 5. Configure the Application Port

There are several ways to set a permanent port:

#### Option A: Using Environment Variables in PM2

Update the `ecosystem.config.js` file with your desired port:

```bash
# Start the application using PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup # Follow the instructions to make PM2 start on boot
```

#### Option B: Using a System Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/shopgram-front.service
```

Add the following content:

```
[Unit]
Description=Shopgram Front - Next.js Application
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/var/www/html/shopgram-front
Environment=PORT=3001
Environment=NODE_ENV=production
ExecStart=/usr/local/bin/yarn start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable shopgram-front
sudo systemctl start shopgram-front
```

### 6. Configure Firewall

Make sure your chosen port is open in the firewall:

```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 7. Configure WHM/cPanel (Reverse Proxy)

If you want to serve your Next.js app through WHM/cPanel using a domain:

1. Log in to WHM as the root user
2. Navigate to "Apache Configuration" → "Include Editor"
3. Choose "Pre VirtualHost Include"
4. Add a reverse proxy configuration:

```apache
<VirtualHost *:80>
    ServerName apadaa.ir
    ServerAlias www.apadaa.ir
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    ErrorLog /var/log/apache2/yourdomain.com-error.log
    CustomLog /var/log/apache2/yourdomain.com-access.log combined
</VirtualHost>
```

5. Save and restart Apache:

```bash
sudo service httpd restart
```

## Troubleshooting

- **Application not starting**: Check logs with `pm2 logs` or `journalctl -u shopgram-front`
- **Port conflicts**: Make sure no other service is using your selected port
- **Permission issues**: Ensure proper file ownership with `chown -R nobody:nobody /var/www/html/shopgram-front`

## Redeployment/Updates

For future updates:

```bash
cd /var/www/html/shopgram-front
git pull
yarn install --frozen-lockfile
yarn build
pm2 restart shopgram-front # If using PM2
# OR
sudo systemctl restart shopgram-front # If using systemd
```

## Monitoring

Use PM2 to monitor your application:

```bash
pm2 monit
pm2 status
```

For more detailed metrics, consider setting up Node.js monitoring through WHM/cPanel or a third-party service. 