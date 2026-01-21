# FreeRADIUS with PostgreSQL support
FROM freeradius/freeradius-server:latest-3.2-alpine

# Install PostgreSQL client
RUN apk add --no-cache \
    postgresql-client

# Create necessary directories
RUN mkdir -p /etc/raddb/mods-config/sql/main/postgresql

# Copy custom configuration files
COPY ./freeradius/radiusd.conf /etc/raddb/radiusd.conf
COPY ./freeradius/clients.conf /etc/raddb/clients.conf
COPY ./freeradius/mods-available/sql /etc/raddb/mods-available/sql
COPY ./freeradius/sites-available/default /etc/raddb/sites-available/default
COPY ./freeradius/queries/postgresql/queries.conf /etc/raddb/mods-config/sql/main/postgresql/queries.conf

# Enable SQL module
RUN ln -sf /etc/raddb/mods-available/sql /etc/raddb/mods-enabled/sql

# Expose RADIUS ports
EXPOSE 1812/udp 1813/udp

# Run FreeRADIUS in foreground with debug
CMD ["radiusd", "-f", "-X"]
