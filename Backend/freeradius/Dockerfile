# FreeRADIUS with PostgreSQL support
FROM freeradius/freeradius-server:3.2-alpine

# Install PostgreSQL client and development libraries
RUN apk add --no-cache \
    postgresql-client \
    postgresql-dev \
    gcc \
    musl-dev \
    make

# Copy custom configuration files
COPY ./freeradius/radiusd.conf /etc/raddb/radiusd.conf
COPY ./freeradius/clients.conf /etc/raddb/clients.conf
COPY ./freeradius/mods-available/sql /etc/raddb/mods-available/sql
COPY ./freeradius/sites-available/default /etc/raddb/sites-available/default

# Enable SQL module
RUN ln -sf /etc/raddb/mods-available/sql /etc/raddb/mods-enabled/sql

# Create directory for SQL queries
RUN mkdir -p /etc/raddb/mods-config/sql/main/postgresql

# Copy PostgreSQL queries
COPY ./freeradius/queries/postgresql/* /etc/raddb/mods-config/sql/main/postgresql/

# Set permissions
RUN chown -R freerad:freerad /etc/raddb

# Expose RADIUS ports
EXPOSE 1812/udp 1813/udp

# Run FreeRADIUS in foreground
CMD ["radiusd", "-f", "-X"]
