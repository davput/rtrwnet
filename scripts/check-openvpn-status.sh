#!/bin/bash
# ============================================
# Check OpenVPN Server Status
# ============================================

echo "============================================"
echo "OpenVPN Server Status Check"
echo "============================================"
echo ""

# Service status
echo "1. Service Status:"
systemctl status openvpn@server --no-pager | head -10
echo ""

# TUN interface
echo "2. TUN Interface:"
ip addr show tun0 2>/dev/null || echo "TUN interface tidak ditemukan"
echo ""

# Port listening
echo "3. Port Listening:"
netstat -ulnp | grep 1194 || ss -ulnp | grep 1194
echo ""

# Connected clients
echo "4. Connected Clients:"
if [ -f /var/log/openvpn-status.log ]; then
    echo "--- Client List ---"
    grep "^CLIENT_LIST" /var/log/openvpn-status.log | awk -F',' '{print "  " $2 " - " $3 " - Connected: " $5}'
    echo ""
    echo "--- Routing Table ---"
    grep "^ROUTING_TABLE" /var/log/openvpn-status.log | awk -F',' '{print "  " $2 " -> " $3}'
else
    echo "Status log tidak ditemukan"
fi
echo ""

# Recent auth logs
echo "5. Recent Auth Logs (last 10):"
if [ -f /var/log/openvpn-auth.log ]; then
    tail -10 /var/log/openvpn-auth.log
else
    echo "Auth log tidak ditemukan"
fi
echo ""

# OpenVPN logs
echo "6. Recent OpenVPN Logs (last 20):"
if [ -f /var/log/openvpn.log ]; then
    tail -20 /var/log/openvpn.log
else
    journalctl -u openvpn@server --no-pager | tail -20
fi
echo ""

echo "============================================"
echo "Selesai"
echo "============================================"
