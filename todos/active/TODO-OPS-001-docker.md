# TODO-OPS-001: Docker Configuration

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 6h
**Dependencies**: TODO-BE-012

---

## Objective

Create Docker configuration for local development and production deployment of the ARC platform.

---

## Tasks

### 1. Backend Dockerfile
- [ ] Create `src/arc/Dockerfile`:
  ```dockerfile
  # syntax=docker/dockerfile:1.4
  FROM python:3.11-slim AS base

  ENV PYTHONDONTWRITEBYTECODE=1 \
      PYTHONUNBUFFERED=1 \
      PIP_NO_CACHE_DIR=1

  WORKDIR /app

  # Install system dependencies
  RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev curl \
      && rm -rf /var/lib/apt/lists/*

  # Install Python dependencies
  FROM base AS dependencies
  COPY pyproject.toml poetry.lock* ./
  RUN pip install poetry && \
      poetry config virtualenvs.create false && \
      poetry install --no-dev --no-interaction

  # Production image
  FROM base AS production
  COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
  COPY --from=dependencies /usr/local/bin /usr/local/bin
  COPY src/arc ./arc

  RUN groupadd --gid 1000 arc && \
      useradd --uid 1000 --gid arc arc && \
      chown -R arc:arc /app
  USER arc

  HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
      CMD curl -f http://localhost:8000/health || exit 1

  EXPOSE 8000
  CMD ["python", "-m", "uvicorn", "arc.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

### 2. Web Frontend Dockerfile
- [ ] Create `apps/web/Dockerfile`:
  ```dockerfile
  FROM node:20-alpine AS base
  WORKDIR /app

  # Dependencies
  FROM base AS dependencies
  COPY package.json package-lock.json ./
  RUN npm ci

  # Development
  FROM dependencies AS development
  COPY . .
  EXPOSE 3000
  CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

  # Build
  FROM dependencies AS build
  COPY . .
  RUN npm run build

  # Production
  FROM nginx:alpine AS production
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  COPY --from=build /app/dist /usr/share/nginx/html
  HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
      CMD wget -q --spider http://localhost:80/health || exit 1
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```

### 3. Web Nginx Configuration
- [ ] Create `apps/web/nginx.conf`:
  ```nginx
  server {
      listen 80;
      server_name _;
      root /usr/share/nginx/html;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      location /health {
          access_log off;
          return 200 "OK";
          add_header Content-Type text/plain;
      }

      location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
          expires 1y;
          add_header Cache-Control "public, immutable";
      }

      gzip on;
      gzip_types text/plain text/css application/json application/javascript;
  }
  ```

### 4. Docker Compose (Development)
- [ ] Create `docker-compose.yml`:
  - PostgreSQL with pgvector
  - Redis
  - API service
  - Worker service
  - Web frontend (dev mode)
  - Volumes for persistence
  - Health checks

### 5. Docker Compose (Production)
- [ ] Create `docker-compose.prod.yml`:
  - Production image tags
  - Resource limits
  - Replica configuration
  - Restart policies
  - Log configuration
  - Secret management

### 6. Docker Ignore Files
- [ ] Create `.dockerignore` for backend:
  ```
  __pycache__
  *.pyc
  .git
  .gitignore
  .env*
  .venv
  venv
  tests/
  docs/
  *.md
  .coverage
  htmlcov/
  ```
- [ ] Create `apps/web/.dockerignore`:
  ```
  node_modules
  .git
  .gitignore
  .env*
  dist
  coverage
  *.md
  ```

### 7. Database Init Script
- [ ] Create `scripts/init-db.sql`:
  ```sql
  -- Enable pgvector extension
  CREATE EXTENSION IF NOT EXISTS vector;

  -- Create application role
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'arc_app') THEN
      CREATE ROLE arc_app WITH LOGIN PASSWORD 'arc_app_password';
    END IF;
  END
  $$;

  -- Grant permissions
  GRANT ALL PRIVILEGES ON DATABASE arc TO arc_app;
  ```

### 8. Development Helper Scripts
- [ ] Create `scripts/docker-dev.sh`:
  ```bash
  #!/bin/bash
  # Start development environment
  docker-compose up -d postgres redis
  docker-compose logs -f api worker
  ```
- [ ] Create `scripts/docker-clean.sh`:
  ```bash
  #!/bin/bash
  # Clean up development environment
  docker-compose down -v
  docker system prune -f
  ```

### 9. Environment Configuration
- [ ] Create `.env.example`:
  ```env
  # Database
  POSTGRES_PASSWORD=arc_dev_password
  DATABASE_URL=postgresql://arc:arc_dev_password@postgres:5432/arc

  # Redis
  REDIS_URL=redis://redis:6379

  # API Keys
  ANTHROPIC_API_KEY=sk-ant-...
  EODHD_API_KEY=...

  # App Config
  LOG_LEVEL=info
  ```

### 10. Build and Test
- [ ] Test local build:
  ```bash
  docker-compose build
  docker-compose up -d
  docker-compose ps
  docker-compose logs api
  ```
- [ ] Test health endpoints
- [ ] Test database connectivity
- [ ] Test API functionality

---

## Acceptance Criteria

- [ ] Backend Dockerfile builds successfully
- [ ] Web Dockerfile builds successfully
- [ ] docker-compose up starts all services
- [ ] PostgreSQL with pgvector works
- [ ] Redis cache works
- [ ] API health check passes
- [ ] Web frontend accessible
- [ ] Worker service runs
- [ ] Volumes persist data
- [ ] Clean script removes all resources

---

## Docker Compose Services

| Service | Image | Ports | Depends On |
|---------|-------|-------|------------|
| postgres | pgvector/pgvector:pg16 | 5432 | - |
| redis | redis:7-alpine | 6379 | - |
| api | arc-api:latest | 8000 | postgres, redis |
| worker | arc-api:latest | - | postgres, redis |
| web | arc-web:latest | 3000 | api |

---

## Resource Limits (Production)

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| api | 2 cores | 4GB |
| worker | 1 core | 2GB |
| web | 0.5 cores | 512MB |

---

## Technical Notes

- Use multi-stage builds to minimize image size
- Run as non-root user in containers
- Use health checks for all services
- Volume mount for development hot reload
- Use .env file for secrets (dev only)
- Production uses Kubernetes secrets
