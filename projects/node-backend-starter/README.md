# Node Backend Starter (Express)

## Run (dev)

npm install
npm run dev

## Docker

Build and run:

docker build -t node-backend-starter .
docker run -p 3000:3000 -e NODE_ENV=production -e JWT_SECRET=change-me node-backend-starter

Compose:

docker compose up --build

## Endpoints

- GET /api/v1/health
- POST /api/v1/echo
- GET /api/v1/me

## Kubernetes probes (example)

readinessProbe:
httpGet:
path: /api/v1/health
port: 3000
initialDelaySeconds: 5
periodSeconds: 10

livenessProbe:
httpGet:
path: /api/v1/health
port: 3000
initialDelaySeconds: 10
periodSeconds: 20
