# TODO-OPS-002: Kubernetes Configuration

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-OPS-001

---

## Objective

Create Kubernetes manifests for production deployment of the ARC platform with proper resource management, scaling, and observability.

---

## Tasks

### 1. Namespace and Config
- [ ] Create `k8s/base/namespace.yaml`:
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: arc
    labels:
      app.kubernetes.io/name: arc
      app.kubernetes.io/part-of: arc-platform
  ```
- [ ] Create `k8s/base/configmap.yaml`:
  - LOG_LEVEL
  - API_PORT
  - WORKER_CONCURRENCY

### 2. Secrets Configuration
- [ ] Create `k8s/base/secrets.yaml`:
  - DATABASE_URL
  - REDIS_URL
  - ANTHROPIC_API_KEY
  - EODHD_API_KEY
  - JWT_SECRET
- [ ] Document external secrets integration (e.g., AWS Secrets Manager)

### 3. API Deployment
- [ ] Create `k8s/base/api-deployment.yaml`:
  - Deployment with 3 replicas
  - Container resources (requests/limits)
  - Readiness probe (/health/ready)
  - Liveness probe (/health/live)
  - Environment from ConfigMap and Secret
  - Security context (non-root)
  - Pod anti-affinity

### 4. API Service
- [ ] Create `k8s/base/api-service.yaml`:
  - ClusterIP service
  - Port 8000
  - Selector for api pods

### 5. API HPA
- [ ] Create `k8s/base/api-hpa.yaml`:
  - Min 3, Max 10 replicas
  - CPU target: 70%
  - Memory target: 80%

### 6. Worker Deployment
- [ ] Create `k8s/base/worker-deployment.yaml`:
  - Deployment with 2 replicas
  - Command override for worker
  - Resource limits
  - Liveness probe
  - Environment variables

### 7. Worker HPA
- [ ] Create `k8s/base/worker-hpa.yaml`:
  - Min 2, Max 5 replicas
  - CPU target: 80%

### 8. Web Deployment
- [ ] Create `k8s/base/web-deployment.yaml`:
  - Deployment with 2 replicas
  - Nginx container
  - Resource limits
  - Health check

### 9. Web Service
- [ ] Create `k8s/base/web-service.yaml`:
  - ClusterIP service
  - Port 80

### 10. Ingress Configuration
- [ ] Create `k8s/base/ingress.yaml`:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: arc-ingress
    annotations:
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/rate-limit: "100"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
  spec:
    tls:
      - hosts:
          - api.arc-platform.com
          - app.arc-platform.com
        secretName: arc-tls
    rules:
      - host: api.arc-platform.com
        http:
          paths:
            - path: /
              pathType: Prefix
              backend:
                service:
                  name: arc-api
                  port:
                    number: 8000
      - host: app.arc-platform.com
        http:
          paths:
            - path: /
              pathType: Prefix
              backend:
                service:
                  name: arc-web
                  port:
                    number: 80
  ```

### 11. Service Accounts
- [ ] Create `k8s/base/serviceaccounts.yaml`:
  - arc-api service account
  - arc-worker service account
  - Minimal RBAC permissions

### 12. Network Policies
- [ ] Create `k8s/base/network-policies.yaml`:
  - API ingress rules
  - Database access rules
  - Inter-service communication
  - Default deny policy

### 13. Pod Disruption Budget
- [ ] Create `k8s/base/pdb.yaml`:
  - API PDB: minAvailable 2
  - Worker PDB: minAvailable 1

### 14. Kustomization
- [ ] Create `k8s/base/kustomization.yaml`:
  ```yaml
  apiVersion: kustomize.config.k8s.io/v1beta1
  kind: Kustomization
  resources:
    - namespace.yaml
    - configmap.yaml
    - secrets.yaml
    - api-deployment.yaml
    - api-service.yaml
    - api-hpa.yaml
    - worker-deployment.yaml
    - worker-hpa.yaml
    - web-deployment.yaml
    - web-service.yaml
    - ingress.yaml
    - serviceaccounts.yaml
    - network-policies.yaml
    - pdb.yaml
  ```

### 15. Environment Overlays
- [ ] Create staging overlay (`k8s/overlays/staging/`)
- [ ] Create production overlay (`k8s/overlays/production/`)
- [ ] Configure environment-specific values

---

## Acceptance Criteria

- [ ] All manifests pass kubectl validation
- [ ] kustomize build succeeds
- [ ] Deployments create correct pods
- [ ] Services route traffic correctly
- [ ] Ingress terminates TLS
- [ ] HPA scales pods
- [ ] Network policies restrict traffic
- [ ] PDB prevents full outage
- [ ] Staging overlay works
- [ ] Production overlay works

---

## Kubernetes Architecture

```
                         ┌─────────────┐
                         │   Ingress   │
                         │ (TLS, Rate  │
                         │  Limiting)  │
                         └──────┬──────┘
                                │
            ┌───────────────────┴───────────────────┐
            │                                       │
     ┌──────▼──────┐                        ┌──────▼──────┐
     │ arc-api     │                        │ arc-web     │
     │ Service     │                        │ Service     │
     │ (ClusterIP) │                        │ (ClusterIP) │
     └──────┬──────┘                        └──────┬──────┘
            │                                       │
     ┌──────▼──────┐                        ┌──────▼──────┐
     │ API Pods    │                        │ Web Pods    │
     │ (3 replicas)│                        │ (2 replicas)│
     └──────┬──────┘                        └─────────────┘
            │
            ├──────────────┐
            │              │
     ┌──────▼──────┐ ┌─────▼──────┐
     │ PostgreSQL  │ │   Redis    │
     │ (Managed)   │ │ (Managed)  │
     └─────────────┘ └────────────┘
            │
     ┌──────▼──────┐
     │ Worker Pods │
     │ (2 replicas)│
     └─────────────┘
```

---

## Resource Specifications

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| API | 500m | 2000m | 1Gi | 4Gi |
| Worker | 250m | 1000m | 512Mi | 2Gi |
| Web | 100m | 500m | 128Mi | 512Mi |

---

## Technical Notes

- Use Kustomize for environment overlays
- External PostgreSQL and Redis (managed services)
- Use cert-manager for TLS certificates
- Consider service mesh (Istio) for advanced traffic management
- PodAntiAffinity spreads pods across nodes
- Use init containers for database migrations
