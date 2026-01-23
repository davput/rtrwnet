# FreeRADIUS with PostgreSQL support
FROM freeradius/freeradius-server:latest-3.2-alpine

# Install PostgreSQL client for view creation
RUN apk add --no-cache postgresql-client

# Create necessary directories
RUN mkdir -p /etc/raddb/mods-config/sql/main/postgresql
RUN mkdir -p /opt/etc/raddb/mods-config/sql/main/postgresql

# Copy ONLY custom configuration files (NOT radiusd.conf - use default!)
# SQL module config
COPY ./freeradius/mods-available/sql /etc/raddb/mods-available/sql
COPY ./freeradius/mods-available/sql /opt/etc/raddb/mods-available/sql

# SQL queries
COPY ./freeradius/queries/postgresql/queries.conf /etc/raddb/mods-config/sql/main/postgresql/queries.conf
COPY ./freeradius/queries/postgresql/queries.conf /opt/etc/raddb/mods-config/sql/main/postgresql/queries.conf

# Clients config (NAS)
COPY ./freeradius/clients.conf /etc/raddb/clients.conf
COPY ./freeradius/clients.conf /opt/etc/raddb/clients.conf

# Site config
COPY ./freeradius/sites-available/default /etc/raddb/sites-available/default
COPY ./freeradius/sites-available/default /opt/etc/raddb/sites-available/default

# Copy entrypoint script
COPY ./freeradius/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Enable SQL module
RUN ln -sf /etc/raddb/mods-available/sql /etc/raddb/mods-enabled/sql 2>/dev/null || true
RUN ln -sf /opt/etc/raddb/mods-available/sql /opt/etc/raddb/mods-enabled/sql 2>/dev/null || true

# Enable default site (remove existing first)
RUN rm -f /etc/raddb/sites-enabled/default 2>/dev/null || true
RUN rm -f /opt/etc/raddb/sites-enabled/default 2>/dev/null || true
RUN ln -sf /etc/raddb/sites-available/default /etc/raddb/sites-enabled/default 2>/dev/null || true
RUN ln -sf /opt/etc/raddb/sites-available/default /opt/etc/raddb/sites-enabled/default 2>/dev/null || true

# Expose RADIUS ports
EXPOSE 1812/udp 1813/udp

# Use entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
