# Kubernetes Manifests dengan Kustomize

Struktur ini menggunakan Kustomize untuk mengelola konfigurasi K8s dengan pendekatan DRY (Don't Repeat Yourself).

## Struktur Direktori

```
k8s/
├── base/                    # Manifest utama (shared)
│   ├── kustomization.yaml
│   ├── backend.yaml
│   ├── frontend-admin.yaml
│   ├── frontend-homepage.yaml
│   ├── frontend-user.yaml
│   ├── postgres.yaml
│   └── redis.yaml
└── overlays/                # Konfigurasi per environment
    ├── staging/
    │   ├── kustomization.yaml
    │   ├── namespace.yaml
    │   ├── configmap.yaml
    │   ├── secrets.yaml
    │   └── ingress.yaml
    └── production/
        ├── kustomization.yaml
        ├── namespace.yaml
        ├── configmap.yaml
        ├── secrets.yaml
        └── ingress.yaml
```

## Cara Penggunaan

### Preview manifest (tanpa apply)

```bash
# Staging
kubectl kustomize k8s/overlays/staging

# Production
kubectl kustomize k8s/overlays/production
```

### Deploy ke cluster

```bash
# Staging
kubectl apply -k k8s/overlays/staging

# Production
kubectl apply -k k8s/overlays/production
```

### Deploy dengan custom image tag (untuk CI/CD)

```bash
# Contoh dengan sed untuk replace image
kubectl kustomize k8s/overlays/staging | \
  sed 's|rtrwnet-backend:latest|your-registry/rtrwnet-backend:v1.0.0|g' | \
  kubectl apply -f -
```

## Perbedaan Environment

| Aspek | Staging | Production |
|-------|---------|------------|
| Namespace | rtrwnet-staging | rtrwnet-prod |
| Domain | *-staging.fureup.my.id | *.fureup.my.id |
| Backend Replicas | 2 | 3 |
| Frontend Replicas | 2 | 3 |

## Menambah Patch Baru

Edit `overlays/<env>/kustomization.yaml` dan tambahkan patch:

```yaml
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
    target:
      kind: Deployment
      name: backend
```

## Catatan Penting

1. **Secrets**: Jangan commit secrets production yang sebenarnya. Gunakan sealed-secrets atau external-secrets.
2. **Images**: Image tag di-handle oleh Jenkins pipeline menggunakan sed substitution.
3. **Postgres Init**: ConfigMap `postgres-init` berisi SQL untuk inisialisasi database.
