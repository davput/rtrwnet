# FreeRADIUS Configuration

Direktori ini berisi konfigurasi FreeRADIUS untuk RT/RW Net SaaS platform.

## Struktur File

```
freeradius/
├── Dockerfile              # FreeRADIUS container image
├── radiusd.conf           # Main FreeRADIUS configuration
├── clients.conf           # NAS (Network Access Server) clients
├── mods-available/
│   └── sql                # SQL module configuration
├── sites-available/
│   └── default            # Default virtual server
└── queries/
    └── postgresql/
        └── queries.conf   # PostgreSQL queries
```

## Konfigurasi

### 1. Database Connection

Edit `mods-available/sql`:

```
server = "postgres"
port = 5432
login = "postgres"
password = "cvkcvk12"
radius_db = "rtrwnet_saas"
```

### 2. NAS Clients

Edit `clients.conf` untuk menambahkan MikroTik atau NAS lainnya:

```
client mikrotik1 {
    ipaddr = 192.168.1.1
    secret = your-secret-here
    require_message_authenticator = no
    nas_type = mikrotik
}
```

### 3. Virtual Server

File `sites-available/default` mengatur:
- Authorization flow
- Authentication methods (PAP, CHAP, MS-CHAP)
- Accounting
- Post-auth logging

## Testing

### 1. Test Configuration

```bash
# Check syntax
docker exec -it rtrwnet-freeradius radiusd -C

# Run in debug mode
docker exec -it rtrwnet-freeradius radiusd -X
```

### 2. Test Authentication

```bash
# From host machine (requires radtest)
radtest username password localhost:1812 0 testing123

# From container
docker exec -it rtrwnet-freeradius radtest username password localhost 0 testing123
```

### 3. Check Logs

```bash
# Container logs
docker-compose logs -f freeradius

# Inside container
docker exec -it rtrwnet-freeradius tail -f /var/log/freeradius/radius.log
```

## Database Tables

FreeRADIUS menggunakan tabel berikut:

### radcheck
Menyimpan credentials untuk authentication:
```sql
username | attribute          | op | value
---------|-------------------|----|---------
user1    | Cleartext-Password| := | pass123
```

### radreply
Menyimpan attributes yang dikirim ke NAS setelah authentication berhasil:
```sql
username | attribute           | op | value
---------|--------------------|----|------------------
user1    | Mikrotik-Rate-Limit| := | 1000k/2000k
user1    | Framed-IP-Address  | := | 10.10.10.100
```

### radacct
Menyimpan accounting records (session logs):
```sql
username | acctsessionid | nasipaddress | framedipaddress | acctstarttime | acctstoptime
---------|---------------|--------------|-----------------|---------------|-------------
user1    | 80000001      | 192.168.1.1  | 10.10.10.100    | 2024-01-20... | NULL
```

## MikroTik Configuration

### PPPoE Server

```
/radius
add address=YOUR_FREERADIUS_IP secret=testing123 service=ppp

/ppp aaa
set use-radius=yes accounting=yes
```

### Hotspot

```
/radius
add address=YOUR_FREERADIUS_IP secret=testing123 service=hotspot

/ip hotspot profile
set default use-radius=yes
```

## Troubleshooting

### Authentication Fails

1. Check user exists in radcheck:
```sql
SELECT * FROM radcheck WHERE username='testuser';
```

2. Check FreeRADIUS logs:
```bash
docker-compose logs freeradius | grep testuser
```

3. Verify NAS secret matches:
```bash
docker exec -it rtrwnet-freeradius grep -r "secret" /etc/raddb/clients.conf
```

### Rate Limit Not Applied

1. Check radreply table:
```sql
SELECT * FROM radreply WHERE username='testuser' AND attribute='Mikrotik-Rate-Limit';
```

2. Verify MikroTik receives the attribute:
```
/log print where topics~"radius"
```

### Accounting Not Working

1. Check radacct table:
```sql
SELECT COUNT(*) FROM radacct;
```

2. Verify MikroTik accounting is enabled:
```
/ppp aaa print
```

3. Check FreeRADIUS accounting logs:
```bash
docker-compose logs freeradius | grep -i acct
```

## Performance Tuning

### Connection Pool

Edit `mods-available/sql`:

```
pool {
    start = 10      # Initial connections
    min = 5         # Minimum connections
    max = 64        # Maximum connections
    spare = 5       # Spare connections
}
```

### Thread Pool

Edit `radiusd.conf`:

```
thread pool {
    start_servers = 10
    max_servers = 64
    min_spare_servers = 5
    max_spare_servers = 20
}
```

## Security

### Best Practices

1. **Change default secrets**: Update `clients.conf` dengan secret yang kuat
2. **Restrict NAS IPs**: Gunakan IP spesifik, bukan 0.0.0.0/0
3. **Enable TLS**: Untuk production, gunakan RadSec (RADIUS over TLS)
4. **Rotate secrets**: Ganti RADIUS secret secara berkala
5. **Monitor logs**: Setup alerting untuk failed authentication attempts

### Example Secure Client

```
client mikrotik1 {
    ipaddr = 192.168.1.1/32
    secret = "$(openssl rand -base64 32)"
    require_message_authenticator = yes
    nas_type = mikrotik
    shortname = mikrotik1
}
```

## Monitoring

### Prometheus Metrics

FreeRADIUS dapat di-export ke Prometheus menggunakan:
- [freeradius_exporter](https://github.com/bvantagelimited/freeradius_exporter)

### Key Metrics

- Total authentication requests
- Authentication success/failure rate
- Average response time
- Active sessions count
- Accounting records per second

## References

- [FreeRADIUS Documentation](https://freeradius.org/documentation/)
- [FreeRADIUS Wiki](https://wiki.freeradius.org/)
- [MikroTik RADIUS](https://wiki.mikrotik.com/wiki/Manual:RADIUS_Client)
- [PostgreSQL SQL Module](https://networkradius.com/doc/3.0.10/raddb/mods-available/sql.html)
