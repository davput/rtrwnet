#!/bin/bash
# ============================================
# Firewall Setup untuk RT/RW Net SaaS
# ============================================

echo "Setting up firewall rules..."

# Check if ufw is installed
if command -v ufw &> /dev/null; then
    echo "Using UFW..."
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports
    ufw allow 3000/tcp    # Homepage
    ufw allow 5174/tcp    # Admin Dashboard
    ufw allow 5175/tcp    # User Dashboard
    ufw allow 8089/tcp    # Backend API
    
    # Allow RADIUS
    ufw allow 1812/udp    # RADIUS Auth
    ufw allow 1813/udp    # RADIUS Accounting
    
    # Allow OpenVPN
    ufw allow 1194/udp    # OpenVPN
    
    # Enable UFW
    ufw --force enable
    
    echo "UFW rules applied!"
    ufw status
    
elif command -v firewall-cmd &> /dev/null; then
    echo "Using firewalld..."
    
    # Allow ports
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=5174/tcp
    firewall-cmd --permanent --add-port=5175/tcp
    firewall-cmd --permanent --add-port=8089/tcp
    firewall-cmd --permanent --add-port=1812/udp
    firewall-cmd --permanent --add-port=1813/udp
    firewall-cmd --permanent --add-port=1194/udp
    
    # Reload
    firewall-cmd --reload
    
    echo "Firewalld rules applied!"
    firewall-cmd --list-all
    
else
    echo "Using iptables..."
    
    # Allow established connections
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
    
    # Allow loopback
    iptables -A INPUT -i lo -j ACCEPT
    
    # Allow SSH
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    
    # Allow HTTP/HTTPS
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    
    # Allow application ports
    iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
    iptables -A INPUT -p tcp --dport 5174 -j ACCEPT
    iptables -A INPUT -p tcp --dport 5175 -j ACCEPT
    iptables -A INPUT -p tcp --dport 8089 -j ACCEPT
    
    # Allow RADIUS
    iptables -A INPUT -p udp --dport 1812 -j ACCEPT
    iptables -A INPUT -p udp --dport 1813 -j ACCEPT
    
    # Allow OpenVPN
    iptables -A INPUT -p udp --dport 1194 -j ACCEPT
    
    # Save rules
    if command -v netfilter-persistent &> /dev/null; then
        netfilter-persistent save
    elif command -v iptables-save &> /dev/null; then
        iptables-save > /etc/iptables.rules
    fi
    
    echo "iptables rules applied!"
fi

echo ""
echo "Firewall setup complete!"
echo ""
echo "Ports opened:"
echo "  - 22/tcp    : SSH"
echo "  - 80/tcp    : HTTP"
echo "  - 443/tcp   : HTTPS"
echo "  - 3000/tcp  : Homepage"
echo "  - 5174/tcp  : Admin Dashboard"
echo "  - 5175/tcp  : User Dashboard"
echo "  - 8089/tcp  : Backend API"
echo "  - 1812/udp  : RADIUS Auth"
echo "  - 1813/udp  : RADIUS Accounting"
echo "  - 1194/udp  : OpenVPN"
