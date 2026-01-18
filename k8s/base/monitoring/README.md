# Monitoring Stack (Prometheus + Grafana)

## Deploy

```bash
kubectl apply -k k8s/base/monitoring
```

## Akses

- Grafana: https://grafana.fureup.my.id
  - Username: `admin`
  - Password: `rtrwnet-grafana-2026`

- Prometheus: https://prometheus.fureup.my.id

## DNS Setup

Tambahkan DNS record untuk:
- `grafana.fureup.my.id` → IP Ingress
- `prometheus.fureup.my.id` → IP Ingress

## Dashboard Grafana yang Direkomendasikan

Import dashboard dari Grafana.com:
1. **Kubernetes Cluster**: ID `6417`
2. **Node Exporter**: ID `1860`
3. **Nginx Ingress**: ID `9614`

## Menambah Metrics di Backend

Tambahkan endpoint `/metrics` di backend Go:

```go
import "github.com/prometheus/client_golang/prometheus/promhttp"

router.GET("/metrics", gin.WrapH(promhttp.Handler()))
```
