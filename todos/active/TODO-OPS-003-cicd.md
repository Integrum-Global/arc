# TODO-OPS-003: CI/CD Pipelines

**Priority**: HIGH
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-OPS-001

---

## Objective

Configure GitHub Actions workflows for continuous integration, testing, building, and deployment of the ARC platform.

---

## Tasks

### 1. CI Workflow - Backend Tests
- [ ] Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    backend-test:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: pgvector/pgvector:pg16
          env:
            POSTGRES_USER: test
            POSTGRES_PASSWORD: test
            POSTGRES_DB: arc_test
          ports: ["5432:5432"]
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
        redis:
          image: redis:7-alpine
          ports: ["6379:6379"]

      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: "3.11"
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
        - name: Run tests
          run: poetry run pytest tests/ -v --cov=arc
          env:
            DATABASE_URL: postgresql://test:test@localhost:5432/arc_test
            REDIS_URL: redis://localhost:6379
  ```

### 2. CI Workflow - Frontend Tests
- [ ] Add frontend-test job:
  ```yaml
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
      - run: npm run build
  ```

### 3. CI Workflow - Mobile Tests
- [ ] Add mobile-test job:
  ```yaml
  mobile-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.27.x'
          channel: 'stable'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test --coverage
  ```

### 4. CI Workflow - Security Scan
- [ ] Add security-scan job:
  ```yaml
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'HIGH,CRITICAL'
  ```

### 5. CD Workflow - Build Images
- [ ] Create `.github/workflows/cd.yml`:
  ```yaml
  name: CD
  on:
    push:
      tags: ['v*']
    workflow_dispatch:
      inputs:
        environment:
          required: true
          type: choice
          options: [staging, production]

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
        - uses: docker/setup-buildx-action@v3
        - uses: docker/login-action@v3
          with:
            registry: ghcr.io
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}
        - name: Build API
          uses: docker/build-push-action@v5
          with:
            context: .
            file: src/arc/Dockerfile
            push: true
            tags: |
              ${{ env.DOCKER_REGISTRY }}/arc-api:${{ steps.version.outputs.version }}
              ${{ env.DOCKER_REGISTRY }}/arc-api:latest
        - name: Build Web
          uses: docker/build-push-action@v5
          with:
            context: apps/web
            push: true
            tags: |
              ${{ env.DOCKER_REGISTRY }}/arc-web:${{ steps.version.outputs.version }}
              ${{ env.DOCKER_REGISTRY }}/arc-web:latest
  ```

### 6. CD Workflow - Deploy Staging
- [ ] Add deploy-staging job:
  ```yaml
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}
      - name: Deploy
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
      - name: Smoke test
        run: |
          sleep 30
          curl -f https://api.staging.arc-platform.com/health
  ```

### 7. CD Workflow - Deploy Production
- [ ] Add deploy-production job:
  ```yaml
  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
      - name: Deploy
        run: |
          kubectl set image deployment/arc-api \
            api=${{ env.DOCKER_REGISTRY }}/arc-api:${{ needs.build.outputs.version }} \
            -n arc
          # ... similar for worker and web
      - name: Notify
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: ${{ secrets.SLACK_DEPLOY_CHANNEL }}
          payload: |
            {"text": "ARC ${{ needs.build.outputs.version }} deployed to production"}
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
  ```

### 8. Pull Request Checks
- [ ] Create `.github/workflows/pr-check.yml`:
  - Run all CI tests
  - Check for breaking changes
  - Preview deployment (optional)
  - Require approval for sensitive changes

### 9. Dependabot Configuration
- [ ] Create `.github/dependabot.yml`:
  ```yaml
  version: 2
  updates:
    - package-ecosystem: "pip"
      directory: "/"
      schedule:
        interval: "weekly"
    - package-ecosystem: "npm"
      directory: "/apps/web"
      schedule:
        interval: "weekly"
    - package-ecosystem: "pub"
      directory: "/apps/mobile"
      schedule:
        interval: "weekly"
    - package-ecosystem: "github-actions"
      directory: "/"
      schedule:
        interval: "weekly"
  ```

### 10. Release Workflow
- [ ] Create `.github/workflows/release.yml`:
  - Create GitHub release
  - Generate changelog
  - Attach build artifacts
  - Notify stakeholders

---

## Acceptance Criteria

- [ ] CI runs on every push and PR
- [ ] All tests pass before merge
- [ ] Security scan identifies vulnerabilities
- [ ] Docker images build successfully
- [ ] Images pushed to container registry
- [ ] Staging deploys automatically
- [ ] Production requires approval
- [ ] Slack notifications work
- [ ] Dependabot creates update PRs
- [ ] Release creates changelog

---

## Workflow Diagram

```
                    ┌──────────────┐
                    │   PR/Push    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
       │Backend Tests│ │Frontend│ │ Mobile   │
       │  + Linting  │ │ Tests  │ │ Tests    │
       └──────┬──────┘ └───┬────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │Security Scan │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ All Passed?  │
                    └──────┬───────┘
                           │ (on tag/manual)
                    ┌──────▼───────┐
                    │ Build Images │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │Deploy Staging│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Smoke Tests  │
                    └──────┬───────┘
                           │ (approval required)
                    ┌──────▼───────┐
                    │Deploy Prod   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Notify     │
                    └──────────────┘
```

---

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| KUBE_CONFIG_STAGING | Staging cluster kubeconfig |
| KUBE_CONFIG_PRODUCTION | Production cluster kubeconfig |
| SLACK_BOT_TOKEN | Slack notification bot |
| SLACK_DEPLOY_CHANNEL | Channel ID for deploy notifications |
| ANTHROPIC_API_KEY | For integration tests |

---

## Technical Notes

- Use GitHub Environments for staging/production
- Require approvals for production deployments
- Cache dependencies for faster builds
- Use matrix strategy for multi-version testing
- Set timeouts to prevent hanging jobs
- Use concurrency limits to prevent duplicate deployments
