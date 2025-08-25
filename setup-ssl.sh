#!/bin/bash

# SSL Setup Script for SMA Maitreyawira Electronic Voting System
# This script sets up SSL certificates for an existing deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/election-system"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_status "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Check if application is deployed
check_deployment() {
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application not found at $APP_DIR"
        print_status "Please run the main deployment script first."
        exit 1
    fi
    
    if [ ! -f "$APP_DIR/app/docker-compose.yml" ]; then
        print_error "Docker compose file not found. Please ensure the application is properly deployed."
        exit 1
    fi
}

# Install SSL certificate
install_ssl() {
    print_status "Installing SSL certificate for $DOMAIN..."
    
    # Stop containers temporarily
    print_status "Stopping containers temporarily..."
    cd $APP_DIR/app
    docker-compose down
    
    # Install Certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        print_status "Installing Certbot..."
        sudo apt update
        sudo apt install -y certbot
    fi
    
    # Generate certificate
    print_status "Generating SSL certificate..."
    sudo certbot certonly --standalone --agree-tos --no-eff-email --email $EMAIL -d voting.$DOMAIN
    
    if [ $? -eq 0 ]; then
        # Create SSL directory if it doesn't exist
        sudo mkdir -p $APP_DIR/ssl
        
        # Copy certificates
        sudo cp /etc/letsencrypt/live/voting.$DOMAIN/fullchain.pem $APP_DIR/ssl/your-cert.pem
        sudo cp /etc/letsencrypt/live/voting.$DOMAIN/privkey.pem $APP_DIR/ssl/your-key.pem
        
        # Generate DH parameters if they don't exist
        if [ ! -f "$APP_DIR/ssl/dhparam.pem" ]; then
            print_status "Generating DH parameters (this may take several minutes)..."
            sudo openssl dhparam -out $APP_DIR/ssl/dhparam.pem 2048
        fi
        
        # Set permissions
        sudo chown -R $USER:$USER $APP_DIR/ssl
        sudo chmod 600 $APP_DIR/ssl/*
        
        # Update nginx configuration to use SSL
        if [ -f "$APP_DIR/app/nginx/sites-available/election-system-ssl" ]; then
            cp $APP_DIR/app/nginx/sites-available/election-system-ssl $APP_DIR/app/nginx/sites-available/election-system
            print_status "Updated nginx configuration for SSL"
        fi
        
        # Update environment files
        update_env_files
        
        # Setup auto-renewal
        setup_auto_renewal
        
        # Restart containers
        print_status "Starting containers with SSL configuration..."
        docker-compose up -d
        
        print_success "SSL certificate installed successfully!"
        print_success "Application is now available at: https://voting.$DOMAIN"
        
    else
        print_error "Failed to generate SSL certificate."
        print_status "Starting containers without SSL..."
        docker-compose up -d
        exit 1
    fi
}

# Update environment files for SSL
update_env_files() {
    print_status "Updating environment files for SSL..."
    
    # Update backend environment
    if [ -f "$APP_DIR/app/backend/.env.production" ]; then
        sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://voting.$DOMAIN|g" $APP_DIR/app/backend/.env.production
        sed -i "s|SSL_ENABLED=.*|SSL_ENABLED=true|g" $APP_DIR/app/backend/.env.production
    fi
    
    # Update frontend environment
    if [ -f "$APP_DIR/app/frontend/.env.production" ]; then
        sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://voting.$DOMAIN/api|g" $APP_DIR/app/frontend/.env.production
    fi
    
    print_success "Environment files updated"
}

# Setup auto-renewal
setup_auto_renewal() {
    print_status "Setting up SSL certificate auto-renewal..."
    
    # Create renewal script
    cat > /tmp/renew-ssl.sh << 'EOF'
#!/bin/bash
/usr/bin/certbot renew --quiet
if [ $? -eq 0 ]; then
    cd /opt/election-system/app && docker-compose restart nginx
fi
EOF
    
    sudo mv /tmp/renew-ssl.sh /usr/local/bin/renew-ssl.sh
    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    print_success "Auto-renewal configured"
}

# Test SSL certificate
test_ssl() {
    print_status "Testing SSL certificate..."
    
    # Wait for containers to start
    sleep 10
    
    # Test HTTPS connection
    if curl -s -f -k https://voting.$DOMAIN/health > /dev/null; then
        print_success "HTTPS connection successful"
    else
        print_warning "HTTPS connection test failed. Please check the configuration."
    fi
    
    # Test certificate validity
    if openssl s_client -connect voting.$DOMAIN:443 -servername voting.$DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates; then
        print_success "SSL certificate is valid"
    else
        print_warning "SSL certificate validation failed"
    fi
}

# Main function
main() {
    print_status "=== SSL Setup for SMA Maitreyawira Electronic Voting System ==="
    
    check_root
    check_deployment
    
    # Get domain and email
    read -p "Enter your domain name (without 'voting.' prefix): " DOMAIN
    read -p "Enter your email for Let's Encrypt: " EMAIL
    
    if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
        print_error "Domain and email are required"
        exit 1
    fi
    
    print_status "Setting up SSL for: voting.$DOMAIN"
    print_status "Email: $EMAIL"
    
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "SSL setup cancelled"
        exit 0
    fi
    
    install_ssl
    test_ssl
    
    echo
    print_success "SSL setup completed successfully!"
    print_status "Certificate will auto-renew. Test renewal with: sudo certbot renew --dry-run"
    print_status "Monitor renewal logs: sudo journalctl -u cron"
}

# Run main function
main "$@"