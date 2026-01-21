# OpenVPN Server with Auto PKI Generation
# Based on kylemanna/openvpn - uses built-in tools
FROM kylemanna/openvpn:latest

LABEL maintainer="RTRWNet SaaS"
LABEL description="Auto-initializing OpenVPN server for MikroTik integration"

# Copy auto-init script
COPY openvpn/auto-init.sh /usr/local/bin/auto-init.sh
RUN chmod +x /usr/local/bin/auto-init.sh

# Set environment variables with defaults
ENV OVPN_SERVER_URL=udp://vpn.example.com
ENV OVPN_NETWORK=10.8.0.0
ENV OVPN_NETMASK=255.255.255.0
ENV OVPN_DNS1=8.8.8.8
ENV OVPN_DNS2=8.8.4.4
ENV TZ=Asia/Jakarta

# Expose OpenVPN port
EXPOSE 1194/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD pgrep openvpn || exit 1

# Run auto-init script
ENTRYPOINT ["/usr/local/bin/auto-init.sh"]
