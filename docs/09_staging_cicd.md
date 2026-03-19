# Staging Environment & CI/CD Pipeline

---

## Part 1: Staging Environment Setup

### Purpose
- Test code before production
- Catch bugs early
- Practice deployment process
- Use real data without affecting production

### Staging vs Production

| Aspect | Staging | Production |
|--------|---------|-----------|
| **Database** | Copy of prod (weekly) OR test data | Real user data |
| **API Keys** | Sandbox keys (bKash, Firebase test project) | Real/live keys |
| **Server** | 1-2 pods (cost-saving) | 2+ pods (high availability) |
| **SSL/TLS** | Self-signed OK | Valid certificate required |
| **Monitoring** | Basic (Winston logs) | Full monitoring + alerting |
| **Data** | May be deleted | Never delete without backup |
| **External APIs** | Sandbox/test (bKash sandbox) | Production (bKash production) |

### Kubernetes Namespace for Staging

**k8s-staging/namespace.yaml:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: foodbela-staging
```

**k8s-staging/server-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodbela-server-staging
  namespace: foodbela-staging
spec:
  replicas: 1  # Single pod for staging
  selector:
    matchLabels:
      app: foodbela-server-staging
  template:
    metadata:
      labels:
        app: foodbela-server-staging
    spec:
      containers:
      - name: foodbela-server
        image: foodbela-server:staging
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "staging"
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secret-staging
              key: MONGO_URI
        - name: BKASH_BASE_URL
          value: "https://tokenized.sandbox.bka.sh/v1.2.0-beta"  # Sandbox
        - name: BKASH_APP_KEY
          valueFrom:
            secretKeyRef:
              name: bkash-secret-staging
              key: BKASH_APP_KEY
        # ... other env vars
```

### Deployment Commands

```bash
# Deploy to staging
kubectl apply -f k8s-staging/

# View staging pods
kubectl get pods -n foodbela-staging

# View staging logs
kubectl logs -n foodbela-staging deployment/foodbela-server-staging -f

# Port forward (access locally)
kubectl port-forward -n foodbela-staging svc/foodbela-server-staging 5000:80
```

### Staging vs Production DNS

```
Staging:  https://staging-api.foodbela.com      (or staging.api.foodbela.com)
          https://staging-admin.foodbela.com

Production: https://api.foodbela.com
            https://admin.foodbela.com
```

---

## Part 2: CI/CD Pipeline (GitHub Actions)

### Repository Structure

```
.github/
├── workflows/
│   ├── test.yml              (run tests on PR)
│   ├── deploy-staging.yml    (deploy to staging on push to develop)
│   ├── deploy-production.yml (deploy to production on push to main)
│   └── health-check.yml      (periodic uptime checks)
├── scripts/
│   └── deploy.sh
```

### Workflow 1: Test on Pull Request

**.github/workflows/test.yml:**

```yaml
name: Run Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongo:
        image: mongo:6.0
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install server dependencies
      working-directory: ./server
      run: npm ci

    - name: Run linter
      working-directory: ./server
      run: npm run lint
      continue-on-error: true

    - name: Run tests
      working-directory: ./server
      env:
        MONGO_URI: mongodb://localhost:27017/foodbela-test
        JWT_SECRET: test_secret
      run: npm run test

    - name: Build web apps
      run: |
        cd admin-web && npm ci && npm run build
        cd ../restaurant-web && npm ci && npm run build
        cd ../customer-web && npm ci && npm run build
```

### Workflow 2: Deploy to Staging

**.github/workflows/deploy-staging.yml:**

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push server image
      uses: docker/build-push-action@v4
      with:
        context: ./server
        file: ./server/Dockerfile
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/foodbela-server:staging
          ${{ secrets.DOCKER_USERNAME }}/foodbela-server:staging-${{ github.sha }}

    - name: Build and push admin-web image
      uses: docker/build-push-action@v4
      with:
        context: ./admin-web
        file: ./admin-web/Dockerfile
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/foodbela-admin-web:staging
          ${{ secrets.DOCKER_USERNAME }}/foodbela-admin-web:staging-${{ github.sha }}

    - name: Update Kubernetes deployment
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG_STAGING }}
      run: |
        mkdir -p $HOME/.kube
        echo "$KUBE_CONFIG" | base64 -d > $HOME/.kube/config
        chmod 600 $HOME/.kube/config

        # Update image in K8s
        kubectl set image deployment/foodbela-server-staging \
          foodbela-server=${{ secrets.DOCKER_USERNAME }}/foodbela-server:staging-${{ github.sha }} \
          -n foodbela-staging

        # Wait for rollout
        kubectl rollout status deployment/foodbela-server-staging -n foodbela-staging

    - name: Run smoke tests against staging
      run: |
        curl -f https://staging-api.foodbela.com/health || exit 1

    - name: Slack notification
      if: always()
      uses: slackapi/slack-github-action@v1
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK }}
        payload: |
          {
            "text": "Staging deployment: ${{ job.status }}",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Staging Deployment*\nStatus: ${{ job.status }}\nCommit: ${{ github.sha }}"
                }
              }
            ]
          }
```

### Workflow 3: Deploy to Production

**.github/workflows/deploy-production.yml:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    # Require approval for production
    environment: production

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push server image
      uses: docker/build-push-action@v4
      with:
        context: ./server
        file: ./server/Dockerfile
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/foodbela-server:latest
          ${{ secrets.DOCKER_USERNAME }}/foodbela-server:${{ github.sha }}

    - name: Build and push admin-web image
      uses: docker/build-push-action@v4
      with:
        context: ./admin-web
        file: ./admin-web/Dockerfile
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/foodbela-admin-web:latest
          ${{ secrets.DOCKER_USERNAME }}/foodbela-admin-web:${{ github.sha }}

    - name: Update Kubernetes deployment
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
      run: |
        mkdir -p $HOME/.kube
        echo "$KUBE_CONFIG" | base64 -d > $HOME/.kube/config
        chmod 600 $HOME/.kube/config

        # Rolling update (default Kubernetes strategy)
        kubectl set image deployment/foodbela-server \
          foodbela-server=${{ secrets.DOCKER_USERNAME }}/foodbela-server:${{ github.sha }} \
          -n foodbela

        # Wait for rollout to complete
        kubectl rollout status deployment/foodbela-server -n foodbela --timeout=10m

    - name: Smoke tests
      run: |
        for i in {1..30}; do
          if curl -f https://api.foodbela.com/health; then
            echo "Health check passed"
            exit 0
          fi
          echo "Attempt $i failed, retrying..."
          sleep 10
        done
        exit 1

    - name: Slack notification
      if: always()
      uses: slackapi/slack-github-action@v1
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK }}
        payload: |
          {
            "text": "🚀 Production deployment: ${{ job.status }}",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Production Deployment*\nStatus: ${{ job.status }}\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                }
              }
            ]
          }
```

### Workflow 4: Health Check (Scheduled)

**.github/workflows/health-check.yml:**

```yaml
name: Health Check

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
    - name: Check Staging API
      run: |
        curl -f https://staging-api.foodbela.com/health || exit 1

    - name: Check Production API
      run: |
        curl -f https://api.foodbela.com/health || exit 1

    - name: Alert on failure
      if: failure()
      uses: slackapi/slack-github-action@v1
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK }}
        payload: |
          {
            "text": "⚠️ Health check failed",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*API Health Alert*\nOne or more APIs are down. Check immediately."
                }
              }
            ]
          }
```

---

## Part 3: GitHub Secrets Setup

In GitHub repository → Settings → Secrets and variables → Actions:

```
DOCKER_USERNAME       = your-docker-hub-username
DOCKER_PASSWORD       = docker-hub-access-token
KUBE_CONFIG_STAGING   = base64-encoded kubeconfig for staging cluster
KUBE_CONFIG_PRODUCTION= base64-encoded kubeconfig for production cluster
SLACK_WEBHOOK         = slack webhook URL (for notifications)
```

**Encode kubeconfig:**
```bash
cat ~/.kube/config-staging | base64 | tr -d '\n' | pbcopy
# Paste in GitHub Secrets
```

---

## Part 4: Deployment Strategy

### Development → Staging → Production Flow

```
1. Developer creates feature branch
   ↓
2. Opens PR to develop
   ↓
3. GitHub Actions runs tests + linting (test.yml)
   ↓
4. Code review + merge to develop
   ↓
5. GitHub Actions builds + deploys to staging (deploy-staging.yml)
   ↓
6. QA tests in staging (may take 1-2 days)
   ↓
7. Merge develop → main (when ready for production)
   ↓
8. GitHub Actions builds + deploys to production (deploy-production.yml)
   ↓
9. Smoke tests + monitoring
```

### Rollback Strategy

```bash
# If production is broken, quick rollback:
kubectl rollout undo deployment/foodbela-server -n foodbela

# View rollout history
kubectl rollout history deployment/foodbela-server -n foodbela

# Rollback to specific revision
kubectl rollout undo deployment/foodbela-server -n foodbela --to-revision=3
```

### Blue-Green Deployment (Optional Future)

For zero-downtime deployments, can implement blue-green strategy:
- Deploy new version to "green" pods
- Switch traffic once green is healthy
- Keep "blue" (old) running for instant rollback

---

## Part 5: Monitoring & Alerts

### Prometheus Metrics (Optional, for future)

When ready, add Prometheus scraping to server:
```js
// server/routes/metrics.js
const prometheus = require('prom-client')

router.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType)
  res.end(prometheus.register.metrics())
})
```

Then in Kubernetes:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: foodbela-server
  namespace: foodbela
spec:
  selector:
    matchLabels:
      app: foodbela-server
  endpoints:
  - port: http
    interval: 30s
    path: /metrics
```

### Log Aggregation (Optional, for future)

Send logs to central location (ELK, Datadog, etc.):
```js
// In Winston logger, add transport for external service
new winston.transports.Http({
  host: 'logs.example.com',
  port: 3000,
  path: '/logs'
})
```

---

## Checklist Before Go-Live

- [ ] Staging environment fully operational
- [ ] All GitHub Actions workflows passing
- [ ] Secrets configured in GitHub
- [ ] Slack notifications working
- [ ] Health check endpoint returning 200 OK
- [ ] Can rollback production within 5 minutes
- [ ] Database backups automated
- [ ] Logs centralized (or at least locally archived)
- [ ] Team trained on deployment process
- [ ] Runbook documented for emergency issues
