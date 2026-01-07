# ARC DevOps & Deployment

## Overview

This document defines the deployment infrastructure, CI/CD pipelines, and operational procedures for the ARC platform.

---

## 1. Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud / GCP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Kubernetes Cluster                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  Ingress    │  │  Ingress    │  │  Ingress    │                 │   │
│  │  │  (API)      │  │  (Web)      │  │  (MCP)      │                 │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│  │         │                │                │                         │   │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐                 │   │
│  │  │ API Service │  │ Web Service │  │ MCP Service │                 │   │
│  │  │ (Nexus)     │  │ (React)     │  │ (Nexus)     │                 │   │
│  │  │ 3 replicas  │  │ 2 replicas  │  │ 2 replicas  │                 │   │
│  │  └──────┬──────┘  └─────────────┘  └──────┬──────┘                 │   │
│  │         │                                 │                         │   │
│  │  ┌──────▼─────────────────────────────────▼──────┐                 │   │
│  │  │              Worker Deployment                 │                 │   │
│  │  │  (Background jobs, sync, calculations)        │                 │   │
│  │  │  2 replicas                                   │                 │   │
│  │  └──────────────────────┬────────────────────────┘                 │   │
│  │                         │                                           │   │
│  └─────────────────────────┼───────────────────────────────────────────┘   │
│                            │                                               │
│  ┌─────────────────────────▼───────────────────────────────────────────┐   │
│  │                     Managed Services                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │ PostgreSQL  │  │   Redis     │  │    S3       │                 │   │
│  │  │ (RDS/Cloud  │  │ (ElastiCache│  │ (Reports,   │                 │   │
│  │  │  SQL)       │  │  /Memorystr)│  │  Backups)   │                 │   │
│  │  │ + pgvector  │  │             │  │             │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Docker Configuration

### 2.1 Backend Dockerfile

**File**: `src/arc/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
FROM base AS dependencies

COPY pyproject.toml poetry.lock* ./

RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# Production image
FROM base AS production

# Copy dependencies from builder
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application code
COPY src/arc ./arc

# Create non-root user
RUN groupadd --gid 1000 arc && \
    useradd --uid 1000 --gid arc --shell /bin/bash arc && \
    chown -R arc:arc /app

USER arc

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Run with uvicorn
CMD ["python", "-m", "uvicorn", "arc.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Web Frontend Dockerfile

**File**: `apps/web/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM dependencies AS build

COPY . .
RUN npm run build

# Production
FROM nginx:alpine AS production

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Docker Compose (Development)

**File**: `docker-compose.yml`

```yaml
version: "3.9"

services:
  # PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg16
    container_name: arc-postgres
    environment:
      POSTGRES_USER: arc
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-arc_dev_password}
      POSTGRES_DB: arc
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arc"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: arc-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  api:
    build:
      context: .
      dockerfile: src/arc/Dockerfile
      target: production
    container_name: arc-api
    environment:
      DATABASE_URL: postgresql://arc:${POSTGRES_PASSWORD:-arc_dev_password}@postgres:5432/arc
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      EODHD_API_KEY: ${EODHD_API_KEY}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Background Worker
  worker:
    build:
      context: .
      dockerfile: src/arc/Dockerfile
      target: production
    container_name: arc-worker
    command: ["python", "-m", "arc.workers.main"]
    environment:
      DATABASE_URL: postgresql://arc:${POSTGRES_PASSWORD:-arc_dev_password}@postgres:5432/arc
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      WORKER_MODE: "true"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Web Frontend (Development)
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
      target: development
    container_name: arc-web
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web/src:/app/src
    environment:
      VITE_API_URL: http://localhost:8000
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### 2.4 Docker Compose (Production)

**File**: `docker-compose.prod.yml`

```yaml
version: "3.9"

services:
  api:
    image: ${DOCKER_REGISTRY}/arc-api:${VERSION:-latest}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "0.5"
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      EODHD_API_KEY: ${EODHD_API_KEY}
      LOG_LEVEL: info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  worker:
    image: ${DOCKER_REGISTRY}/arc-api:${VERSION:-latest}
    command: ["python", "-m", "arc.workers.main"]
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "1"
          memory: 2G
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      WORKER_MODE: "true"

  web:
    image: ${DOCKER_REGISTRY}/arc-web:${VERSION:-latest}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 3. Kubernetes Configuration

### 3.1 Namespace & Config

**File**: `k8s/base/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: arc
  labels:
    app.kubernetes.io/name: arc
    app.kubernetes.io/part-of: arc-platform
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: arc-config
  namespace: arc
data:
  LOG_LEVEL: "info"
  API_PORT: "8000"
  WORKER_CONCURRENCY: "4"
---
apiVersion: v1
kind: Secret
metadata:
  name: arc-secrets
  namespace: arc
type: Opaque
stringData:
  DATABASE_URL: "${DATABASE_URL}"
  REDIS_URL: "${REDIS_URL}"
  ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}"
  EODHD_API_KEY: "${EODHD_API_KEY}"
```

### 3.2 API Deployment

**File**: `k8s/base/api-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arc-api
  namespace: arc
  labels:
    app: arc-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: arc-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: arc-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: arc-api
      containers:
        - name: api
          image: arc-api:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8000
              protocol: TCP
          envFrom:
            - configMapRef:
                name: arc-config
            - secretRef:
                name: arc-secrets
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 30
            timeoutSeconds: 10
            failureThreshold: 3
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: arc-api
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: arc-api
  namespace: arc
spec:
  selector:
    app: arc-api
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: arc-api-hpa
  namespace: arc
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: arc-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 3.3 Worker Deployment

**File**: `k8s/base/worker-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arc-worker
  namespace: arc
  labels:
    app: arc-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arc-worker
  template:
    metadata:
      labels:
        app: arc-worker
    spec:
      serviceAccountName: arc-worker
      containers:
        - name: worker
          image: arc-api:latest
          command: ["python", "-m", "arc.workers.main"]
          imagePullPolicy: Always
          envFrom:
            - configMapRef:
                name: arc-config
            - secretRef:
                name: arc-secrets
          env:
            - name: WORKER_MODE
              value: "true"
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "2Gi"
          livenessProbe:
            exec:
              command:
                - python
                - -c
                - "import arc.workers.health; arc.workers.health.check()"
            initialDelaySeconds: 30
            periodSeconds: 60
            timeoutSeconds: 10
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: arc-worker-hpa
  namespace: arc
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: arc-worker
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
```

### 3.4 Ingress

**File**: `k8s/base/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: arc-ingress
  namespace: arc
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
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

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions - CI

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: "3.11"
  NODE_VERSION: "20"

jobs:
  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: arc_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        run: pip install poetry

      - name: Cache Poetry
        uses: actions/cache@v4
        with:
          path: ~/.cache/pypoetry
          key: poetry-${{ hashFiles('poetry.lock') }}

      - name: Install dependencies
        run: poetry install

      - name: Run linting
        run: |
          poetry run ruff check src/
          poetry run black --check src/

      - name: Run type checking
        run: poetry run mypy src/arc

      - name: Run unit tests
        run: |
          poetry run pytest tests/unit -v --cov=arc --cov-report=xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/arc_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: |
          poetry run pytest tests/integration -v --cov=arc --cov-append --cov-report=xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/arc_test
          REDIS_URL: redis://localhost:6379
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: coverage.xml

  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run typecheck

      - name: Run tests
        run: npm run test -- --coverage

      - name: Build
        run: npm run build

  # Security Scan
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'HIGH,CRITICAL'
```

### 4.2 GitHub Actions - CD

**File**: `.github/workflows/cd.yml`

```yaml
name: CD

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  DOCKER_REGISTRY: ghcr.io/${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}

    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: version
        run: |
          if [[ $GITHUB_REF == refs/tags/* ]]; then
            echo "version=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
          else
            echo "version=sha-${GITHUB_SHA::8}" >> $GITHUB_OUTPUT
          fi

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: src/arc/Dockerfile
          target: production
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/arc-api:${{ steps.version.outputs.version }}
            ${{ env.DOCKER_REGISTRY }}/arc-api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: apps/web
          file: apps/web/Dockerfile
          target: production
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/arc-web:${{ steps.version.outputs.version }}
            ${{ env.DOCKER_REGISTRY }}/arc-web:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    if: github.event.inputs.environment == 'staging' || startsWith(github.ref, 'refs/tags/')

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/arc-api \
            api=${{ env.DOCKER_REGISTRY }}/arc-api:${{ needs.build.outputs.version }} \
            -n arc-staging

          kubectl set image deployment/arc-worker \
            worker=${{ env.DOCKER_REGISTRY }}/arc-api:${{ needs.build.outputs.version }} \
            -n arc-staging

          kubectl set image deployment/arc-web \
            web=${{ env.DOCKER_REGISTRY }}/arc-web:${{ needs.build.outputs.version }} \
            -n arc-staging

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/arc-api -n arc-staging --timeout=300s
          kubectl rollout status deployment/arc-web -n arc-staging --timeout=300s

      - name: Run smoke tests
        run: |
          # Wait for API to be ready
          sleep 30
          curl -f https://api.staging.arc-platform.com/health

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    if: github.event.inputs.environment == 'production' || startsWith(github.ref, 'refs/tags/v')

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/arc-api \
            api=${{ env.DOCKER_REGISTRY }}/arc-api:${{ needs.build.outputs.version }} \
            -n arc

          kubectl set image deployment/arc-worker \
            worker=${{ env.DOCKER_REGISTRY }}/arc-api:${{ needs.build.outputs.version }} \
            -n arc

          kubectl set image deployment/arc-web \
            web=${{ env.DOCKER_REGISTRY }}/arc-web:${{ needs.build.outputs.version }} \
            -n arc

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/arc-api -n arc --timeout=300s
          kubectl rollout status deployment/arc-web -n arc --timeout=300s

      - name: Notify success
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: ${{ secrets.SLACK_DEPLOY_CHANNEL }}
          payload: |
            {
              "text": "ARC ${{ needs.build.outputs.version }} deployed to production"
            }
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

---

## 5. Monitoring & Observability

### 5.1 Prometheus Configuration

**File**: `k8s/monitoring/prometheus.yaml`

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: arc-api
  namespace: arc
  labels:
    app: arc-api
spec:
  selector:
    matchLabels:
      app: arc-api
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: arc-alerts
  namespace: arc
spec:
  groups:
    - name: arc.rules
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{app="arc-api",status=~"5.."}[5m])) /
            sum(rate(http_requests_total{app="arc-api"}[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: High error rate in ARC API
            description: Error rate is above 5% for 5 minutes

        - alert: HighLatency
          expr: |
            histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{app="arc-api"}[5m])) by (le)) > 2
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: High latency in ARC API
            description: P95 latency is above 2 seconds

        - alert: PodNotReady
          expr: |
            kube_pod_status_ready{namespace="arc",condition="true"} == 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: ARC pod not ready
            description: Pod {{ $labels.pod }} is not ready
```

### 5.2 Grafana Dashboard

**File**: `k8s/monitoring/grafana-dashboard.json`

```json
{
  "title": "ARC Platform Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{app=\"arc-api\"}[5m]))"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "gauge",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{app=\"arc-api\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{app=\"arc-api\"}[5m])) * 100"
        }
      ]
    },
    {
      "title": "P95 Latency",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{app=\"arc-api\"}[5m])) by (le))"
        }
      ]
    },
    {
      "title": "Active Pods",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(kube_pod_status_ready{namespace=\"arc\",condition=\"true\"})"
        }
      ]
    }
  ]
}
```

---

## 6. Implementation Checklist

### Phase 1: Docker Setup
- [ ] Create backend Dockerfile
- [ ] Create web frontend Dockerfile
- [ ] Create docker-compose.yml for dev
- [ ] Test local development environment

### Phase 2: Kubernetes Setup
- [ ] Create namespace and config
- [ ] Create API deployment and service
- [ ] Create worker deployment
- [ ] Create web deployment
- [ ] Configure ingress with TLS
- [ ] Set up HPA for autoscaling

### Phase 3: CI/CD Pipeline
- [ ] Set up GitHub Actions CI
- [ ] Configure linting and testing
- [ ] Set up Docker image builds
- [ ] Configure staging deployment
- [ ] Configure production deployment
- [ ] Add deployment notifications

### Phase 4: Monitoring
- [ ] Set up Prometheus ServiceMonitor
- [ ] Create alerting rules
- [ ] Create Grafana dashboard
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring

### Phase 5: Security
- [ ] Configure secrets management
- [ ] Set up network policies
- [ ] Enable pod security policies
- [ ] Configure backup procedures
- [ ] Document disaster recovery
