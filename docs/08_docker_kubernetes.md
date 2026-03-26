# Docker & Kubernetes Deployment

---

## Part 1: Docker Setup

### Dockerfile for Server

**server/Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy app code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

### Dockerfile for Restaurant Web (React)

**restaurant-web/Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Docker Compose (Development)

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:6.0
    container_name: foodbela-mongo
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo-data:/data/db
    networks:
      - foodbela-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: foodbela-server
    ports:
      - '5000:5000'
    environment:
      PORT: 5000
      MONGO_URI: mongodb://admin:password@mongo:27017/foodbela?authSource=admin
      JWT_SECRET: your_jwt_secret
      NODE_ENV: development
    depends_on:
      - mongo
    networks:
      - foodbela-network
    volumes:
      - ./server:/app
    command: npm run dev

  admin-web:
    build:
      context: ./admin-web
      dockerfile: Dockerfile
    container_name: foodbela-admin
    ports:
      - '3001:3000'
    environment:
      VITE_API_URL: http://localhost:5000
    depends_on:
      - server
    networks:
      - foodbela-network

  restaurant-web:
    build:
      context: ./restaurant-web
      dockerfile: Dockerfile
    container_name: foodbela-restaurant
    ports:
      - '3002:3000'
    environment:
      VITE_API_URL: http://localhost:5000
    depends_on:
      - server
    networks:
      - foodbela-network

volumes:
  mongo-data:

networks:
  foodbela-network:
    driver: bridge
```

### Build & Run Locally

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# View logs
docker-compose logs -f server

# Stop
docker-compose down
```

---

## Part 2: Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Docker + Minikube (for local K8s testing)
# Or use managed Kubernetes: AWS EKS, GKE (Google), DigitalOcean, Linode
```

### Kubernetes Manifests

**k8s/namespace.yaml:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: foodbela
```

**k8s/mongodb-secret.yaml:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-secret
  namespace: foodbela
type: Opaque
stringData:
  MONGO_URI: mongodb+srv://username:password@cluster.mongodb.net/foodbela?retryWrites=true&w=majority
```

**k8s/configmap.yaml:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: foodbela
data:
  PORT: "5000"
  JWT_EXPIRES_IN: "7d"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
```

**k8s/server-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodbela-server
  namespace: foodbela
  labels:
    app: foodbela-server
spec:
  replicas: 2  # Min 2 pods
  selector:
    matchLabels:
      app: foodbela-server
  template:
    metadata:
      labels:
        app: foodbela-server
    spec:
      containers:
      - name: foodbela-server
        image: foodbela-server:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
          name: http
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: PORT
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: MONGO_URI
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: JWT_SECRET
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---

apiVersion: v1
kind: Service
metadata:
  name: foodbela-server
  namespace: foodbela
  labels:
    app: foodbela-server
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5000
    protocol: TCP
    name: http
  selector:
    app: foodbela-server
  sessionAffinity: ClientIP  # IMPORTANT: Sticky sessions for Socket.IO
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 3 hours
```

**k8s/admin-web-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foodbela-admin-web
  namespace: foodbela
  labels:
    app: foodbela-admin-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: foodbela-admin-web
  template:
    metadata:
      labels:
        app: foodbela-admin-web
    spec:
      containers:
      - name: foodbela-admin-web
        image: foodbela-admin-web:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: VITE_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: API_URL
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---

apiVersion: v1
kind: Service
metadata:
  name: foodbela-admin-web
  namespace: foodbela
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: foodbela-admin-web
```

**k8s/ingress.yaml (Nginx Ingress):**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: foodbela-ingress
  namespace: foodbela
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    # Socket.IO sticky sessions — required for WebSocket with 2+ pods
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "io-session"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
spec:
  rules:
  - host: api.foodbela.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: foodbela-server
            port:
              number: 80
  - host: admin.foodbela.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: foodbela-admin-web
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl apply -f k8s/mongodb-secret.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Deploy server (2+ pods)
kubectl apply -f k8s/server-deployment.yaml

# Deploy web apps
kubectl apply -f k8s/admin-web-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n foodbela
kubectl get svc -n foodbela
kubectl get ingress -n foodbela

# View logs
kubectl logs -n foodbela deployment/foodbela-server -f

# Scale up/down
kubectl scale deployment foodbela-server -n foodbela --replicas=3
```

---

## Part 3: Important Notes for Kubernetes

### Socket.IO with Multiple Pods

**Problem:** Socket.IO maintains in-memory connections. With 2+ pods, if client connects to Pod 1 and then request goes to Pod 2, it won't find the connection.

**Solution:** Use **sticky sessions** (already configured in `server-deployment.yaml`):
```yaml
sessionAffinity: ClientIP  # Routes same client to same pod
sessionAffinityConfig:
  clientIP:
    timeoutSeconds: 10800  # 3 hours
```

This ensures all WebSocket connections from same client go to same pod.

**Alternative (if needed later):** Use Redis adapter for Socket.IO (not implemented now).

### In-Memory State with Multiple Pods

**Problem:** `pendingOrderTimeouts` Map is in-memory — exists only on one pod.

**Solution:** Use DB-based approach with cron job (documented in M1):
- Store `riderAssignmentDeadline` in Order document
- Run cron job on each pod (idempotent check)
- Works across all pods

### Environment Variables

Each pod automatically gets env vars from Kubernetes secrets + configmaps.

Add any new secrets via:
```bash
kubectl create secret generic my-secret --from-literal=KEY=VALUE -n foodbela
```

---

## Part 4: Cloud Deployment Options

### DigitalOcean Kubernetes (DOKS)
```bash
# Install doctl CLI
# Create cluster via doctl or web UI
doctl kubernetes cluster create foodbela --region blr --node-pool standard-s-2vcpu-4gb --count 2

# Connect
doctl kubernetes cluster kubeconfig save foodbela
kubectl config use-context do-blr-foodbela

# Deploy
kubectl apply -f k8s/
```

### AWS EKS
```bash
# Create cluster via AWS Console or eksctl
eksctl create cluster --name foodbela --region ap-south-1 --nodegroup-name standard --node-type t3.medium --nodes 2

# Deploy
kubectl apply -f k8s/
```

### Google Cloud GKE
```bash
# Create cluster
gcloud container clusters create foodbela --zone asia-south1-a --num-nodes 2

# Get credentials
gcloud container clusters get-credentials foodbela

# Deploy
kubectl apply -f k8s/
```

---

## Startup Checklist

- [ ] Dockerfile builds locally
- [ ] docker-compose up works
- [ ] Kubernetes manifests validated (`kubectl apply --dry-run=client -f k8s/`)
- [ ] Secrets created in K8s cluster
- [ ] 2+ server pods running
- [ ] Health check endpoint (`/health`) working
- [ ] Socket.IO connections persistent with sticky sessions
- [ ] Logs accessible via `kubectl logs`
- [ ] Scaling test: `kubectl scale deployment foodbela-server --replicas=3` works
