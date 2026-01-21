# OpenVPN Server with Username/Password Authentication (No Certificate)
FROM alpine:3.18

RUN apk add --no-cache \
    openvpn \
    bash \
    iptables \
    easy-rsa

# Create directories
RUN mkdir -p /etc/openvpn /var/log/openvpn

# Copy config and scripts (paths relative to build context)
COPY server.conf /etc/openvpn/server.conf
COPY auth-user.sh /etc/openvpn/auth-user.sh
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /etc/openvpn/auth-user.sh /entrypoint.sh

# Environment
ENV OVPN_NETWORK=10.8.0.0
ENV OVPN_NETMASK=255.255.255.0

EXPOSE 1194/udp

ENTRYPOINT ["/entrypoint.sh"]
