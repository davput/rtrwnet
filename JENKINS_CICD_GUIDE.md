# Jenkins CI/CD Guide

## Overview

Pipeline Jenkins untuk deploy RT/RW Net SaaS ke Kubernetes dengan support untuk FreeRADIUS dan OpenVPN.

## Architecture

```
GitHub → Jenkins → Docker Build → Docker Registry → Kubernetes Deploy
                                                    ├── Backend
                                                    ├── Frontend (User/Admin/Home)
                                                    ├── FreeRADIUS
                                                    ├── OpenVPN
                                                    ├── PostgreSQL
                                                    └── Redis
```

## Prerequisites

### 1. Jenkins Setup

```bash
# Install Jenkins plugins
- Docker Pipeline
- Kubernetes CLI
- Git
- Pipeline
- Credentials Binding
```

### 2. Credentials di Jenkins

Buat credentials berikut di Jenkins:

#### Docker Hub Credentials
- **ID**: `docker-credentials-id`
- **Type**: Username with password
- **Username**: Your Docker Hub username
- **Password**: Your Docker Hub password/token

#### Kubeconfig Credentials
- **ID**: `kubeconfig-credentials-id`
- **Type**: Secret file
- **File**: Your kubeconfig file

### 3. Environment Variables

Update di Jenkinsfile:

```groovy
environment {
    DOCKER_REPO = 'davaputra'  // Ganti dengan Docker Hub username Anda
    DOCKER_CREDENTIALS = 'docker-credentials-id'
    KUBECONFIG_CREDENTIALS = 'kubeconfig-credentials-id'
}
```

## Pipeline Parameters

### Environment
- **staging**: Deploy ke namespace `rtrwnet-staging`
- **production**: Deploy ke namespace `rtrwnet-prod`

### Deploy Options
- ✅ **DEPLOY_BACKEND** - Deploy Go backend API
- ✅ **DEPLOY_USER_DASHBOARD** - Deploy user dashboard (React)
- ✅ **DEPLOY_ADMIN_DASHBOARD** - Deploy admin dashboard (React)
- ✅ **DEPLOY_HOMEPAGE** - Deploy homepage (React)
- ✅ **DEPLOY_FREERADIUS** - Deploy FreeRADIUS server
- ✅ **DEPLOY_OPENVPN** - Deploy OpenVPN server
- ⬜ **DEPLOY_MONITORING** - Deploy Prometheus + Grafana

## Pipeline Stages

### 1. Checkout
Clone repository dari Git

### 2. Set Environment
Set namespace dan API URL berdasarkan environment:
- **Staging**: `rtrwnet-staging`, `https://api-staging.fureup.my.id`
- **Production**: `rtrwnet-prod`, `https://api.fureup.my.id`

### 3. Build Images
Build Docker images untuk services yang dipilih:
- Backend: `davaputra/rtrwnet-backend:${BUILD_NUMBER}`
- User Dashboard: `davaputra/rtrwnet-user-dashboard:${BUILD_NUMBER}`
- Admin Dashboard: `davaputra/rtrwnet-admin-dashboard:${BUILD_NUMBER}`
- Homepage: `davaputra/rtrwnet-homepage:${BUILD_NUMBER}`
- FreeRADIUS: `davaputra/rtrwnet-freeradius:${BUILD_NUMBER}`

### 4. Push Images
Push images ke Docker Hub dengan tags:
- `${BUILD_NUMBER}-${GIT_COMMIT}`
- `latest`

### 5. Deploy to Kubernetes
Deploy menggunakan Kustomize:
- Apply manifests dari `k8s/overlays/${ENVIRONMENT}`
- Patch deployments dengan image tags baru
- Rollout restart untuk services yang dipilih

### 6. Verify Deployment
Verify rollout status untuk semua deployments

## Usage

### Deploy Staging (All Services)

1. Open Jenkins job
2. Click "Build with Parameters"
3. Select:
   - Environment: **staging**
   - All deploy options: **checked**
4. Click "Build"

### Deploy Production (Backend Only)

1. Open Jenkins job
2. Click "Build with Parameters"
3. Select:
   - Environment: **production**
   - DEPLOY_BACKEND: **checked**
   - Others: **unchecked**
4. Click "Build"

### Deploy FreeRADIUS & OpenVPN Only

1. Open Jenkins job
2. Click "Build with Parameters"
3. Select:
   - Environment: **staging** or **production**
   - DEPLOY_FREERADIUS: **checked**
   - DEPLOY_OPENVPN: **checked**
   - Others: **unchecked**
4. Click "Build"

## Kubernetes Manifests

### Base Manifests (`k8s/base/`)

- `backend-deployment.yaml` - Backend API
- `frontend-*-deployment.yaml` - Frontend apps
- `freeradius-deployment.yaml` - FreeRADIUS server
- `openvpn-deployment.yaml` - OpenVPN server
- `postgres-deployment.yaml` - PostgreSQL database
- `redis-deployment.yaml` - Redis cache

### Overlays

#### Staging (`k8s/overlays/staging/`)
- Lower resources
- Single replica
- Staging domain

#### Production (`k8s/overlays/production/`)
- Higher resources
- Multiple replicas (backend: 2, freeradius: 2)
- Production domain
- Auto-scaling enabled

## Resource Allocation

### Staging

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Backend | 250m | 500m | 256Mi | 512Mi |
| FreeRADIUS | 250m | 500m | 256Mi | 512Mi |
| OpenVPN | 100m | 200m | 128Mi | 256Mi |
| Frontend | 100m | 200m | 128Mi | 256Mi |

### Production

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Backend | 500m | 1000m | 512Mi | 1Gi |
| FreeRADIUS | 500m | 1000m | 512Mi | 1Gi |
| OpenVPN | 200m | 500m | 256Mi | 512Mi |
| Frontend | 200m | 400m | 256Mi | 512Mi |

## Networking

### Services

- **Backend**: ClusterIP (internal only, exposed via Ingress)
- **FreeRADIUS**: ClusterIP (UDP 1812, 1813)
- **OpenVPN**: LoadBalancer (UDP 1194)
- **Frontend**: ClusterIP (exposed via Ingress)

### Ingress

```yaml
# Staging
api-staging.fureup.my.id → backend:8089
app-staging.fureup.my.id → frontend-user:80
admin-staging.fureup.my.id → frontend-admin:80
staging.fureup.my.id → frontend-homepage:80

# Production
api.fureup.my.id → backend:8089
app.fureup.my.id → frontend-user:80
admin.fureup.my.id → frontend-admin:80
fureup.my.id → frontend-homepage:80
```

## Secrets Management

### Staging Secrets (`k8s/overlays/staging/secrets.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DB_USER: postgres
  DB_PASSWORD: staging_password
  JWT_SECRET: staging_jwt_secret
  MIDTRANS_SERVER_KEY: sandbox_key
```

### Production Secrets (`k8s/overlays/production/secrets.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DB_USER: postgres
  DB_PASSWORD: strong_production_password
  JWT_SECRET: super_secret_production_jwt
  MIDTRANS_SERVER_KEY: production_key
```

**⚠️ IMPORTANT**: Jangan commit secrets ke Git! Use sealed-secrets atau external secret management.

## Monitoring

### Check Deployment Status

```bash
# Staging
kubectl get pods -n rtrwnet-staging
kubectl get svc -n rtrwnet-staging
kubectl logs -f deployment/backend -n rtrwnet-staging

# Production
kubectl get pods -n rtrwnet-prod
kubectl get svc -n rtrwnet-prod
kubectl logs -f deployment/backend -n rtrwnet-prod
```

### Check FreeRADIUS

```bash
# Staging
kubectl exec -it deployment/freeradius -n rtrwnet-staging -- radiusd -X

# Production
kubectl exec -it deployment/freeradius -n rtrwnet-prod -- radiusd -X
```

### Check OpenVPN

```bash
# Staging
kubectl logs -f deployment/openvpn -n rtrwnet-staging

# Production
kubectl logs -f deployment/openvpn -n rtrwnet-prod
```

## Rollback

### Via Jenkins

1. Go to previous successful build
2. Click "Rebuild"

### Via kubectl

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n rtrwnet-staging

# Rollback to specific revision
kubectl rollout history deployment/backend -n rtrwnet-staging
kubectl rollout undo deployment/backend --to-revision=2 -n rtrwnet-staging
```

## Troubleshooting

### Build Failed

```bash
# Check Jenkins console output
# Common issues:
- Docker build error → Check Dockerfile
- Push error → Check Docker Hub credentials
- Kubernetes error → Check kubeconfig
```

### Deployment Failed

```bash
# Check pod status
kubectl get pods -n rtrwnet-staging

# Check pod logs
kubectl logs <pod-name> -n rtrwnet-staging

# Describe pod for events
kubectl describe pod <pod-name> -n rtrwnet-staging
```

### FreeRADIUS Not Working

```bash
# Check logs
kubectl logs deployment/freeradius -n rtrwnet-staging

# Check database connection
kubectl exec -it deployment/freeradius -n rtrwnet-staging -- radiusd -X

# Test authentication
kubectl exec -it deployment/freeradius -n rtrwnet-staging -- radtest testuser testpass localhost 0 testing123
```

### OpenVPN Not Connecting

```bash
# Check logs
kubectl logs deployment/openvpn -n rtrwnet-staging

# Check service
kubectl get svc openvpn -n rtrwnet-staging

# Check LoadBalancer IP
kubectl get svc openvpn -n rtrwnet-staging -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

## Best Practices

1. **Always test in staging first**
2. **Use semantic versioning for tags**
3. **Keep secrets encrypted**
4. **Monitor resource usage**
5. **Set up alerts for failures**
6. **Regular backups of database**
7. **Document all changes**

## Automation

### Webhook Trigger

Setup GitHub webhook untuk auto-trigger Jenkins:

1. GitHub → Settings → Webhooks
2. Payload URL: `http://jenkins.yourdomain.com/github-webhook/`
3. Content type: `application/json`
4. Events: `Push`, `Pull Request`

### Scheduled Builds

```groovy
// Add to Jenkinsfile
triggers {
    // Build every night at 2 AM
    cron('0 2 * * *')
}
```

## Security

### Image Scanning

Add to Jenkinsfile:

```groovy
stage('Security Scan') {
    steps {
        sh "trivy image ${DOCKER_REPO}/rtrwnet-backend:${IMAGE_TAG}"
    }
}
```

### RBAC

Ensure Jenkins service account has proper permissions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: jenkins-deployer
rules:
- apiGroups: ["apps", ""]
  resources: ["deployments", "services", "pods"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
```

## Support

- Jenkins Docs: https://www.jenkins.io/doc/
- Kubernetes Docs: https://kubernetes.io/docs/
- Kustomize Docs: https://kustomize.io/
