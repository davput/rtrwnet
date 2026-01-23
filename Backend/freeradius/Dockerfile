# FreeRADIUS with PostgreSQL support
FROM freeradius/freeradius-server:latest-3.2-alpine

# Install PostgreSQL client for view creation
RUN apk add --no-cache postgresql-client

# Create necessary directories
RUN mkdir -p /etc/raddb/mods-config/sql/main/postgresql
RUN mkdir -p /opt/etc/raddb/mods-config/sql/main/postgresql

# Copy custom configuration files to both paths
COPY ./freeradius/radiusd.conf /etc/raddb/radiusd.conf
COPY ./freeradius/clients.conf /etc/raddb/clients.conf
COPY ./freeradius/mods-available/sql /etc/raddb/mods-available/sql
COPY ./freeradius/sites-available/default /etc/raddb/sites-available/default
COPY ./freeradius/queries/postgresql/queries.conf /etc/raddb/mods-config/sql/main/postgresql/queries.conf

# Also copy to /opt/etc/raddb (used by official image)
COPY ./freeradius/radiusd.conf /opt/etc/raddb/radiusd.conf
COPY ./freeradius/clients.conf /opt/etc/raddb/clients.conf
COPY ./freeradius/mods-available/sql /opt/etc/raddb/mods-available/sql
COPY ./freeradius/sites-available/default /opt/etc/raddb/sites-available/default
COPY ./freeradius/queries/postgresql/queries.conf /opt/etc/raddb/mods-config/sql/main/postgresql/queries.conf

# Copy entrypoint script
COPY ./freeradius/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Enable SQL module in both paths
RUN ln -sf /etc/raddb/mods-available/sql /etc/raddb/mods-enabled/sql 2>/dev/null || true
RUN ln -sf /opt/etc/raddb/mods-available/sql /opt/etc/raddb/mods-enabled/sql 2>/dev/null || true

# Enable default site in both paths
RUN ln -sf /etc/raddb/sites-available/default /etc/raddb/sites-enabled/default 2>/dev/null || true
RUN ln -sf /opt/etc/raddb/sites-available/default /opt/etc/raddb/sites-enabled/default 2>/dev/null || true

# Expose RADIUS ports
EXPOSE 1812/udp 1813/udp

# Use entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
