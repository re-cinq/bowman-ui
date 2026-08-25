---
adr_number: 3
title: Deployment Strategy and Container Architecture
status: accepted
date: 2026-08-24
domains:
  - deployment
  - infrastructure
  - containerization
  - ci-cd
decision_makers:
  - Platform Team
  - DevOps
consulted:
  - Frontend Engineering
  - Release Management
---

# ADR-003: Deployment Strategy and Container Architecture

## Context

`bowman-ui` is a published NPM package (`@re-cinq/bowman-ui`) providing React UI components for AI chat interfaces. The repository requires a deployment and distribution strategy covering:

1. **Package Distribution**: NPM registry release for library consumers
2. **Artifact Containerization**: Optional Docker image for documentation/demo environments
3. **CI/CD Pipeline**: Automated testing, building, and publishing
4. **Container Orchestration**: Deployment targets for demo/staging environments

The decision must balance simplicity (this is a component library, not a full application) with operational standards (organization uses Kubernetes for orchestration).

## Decision

We adopt a **hybrid, container-first deployment model**:

### 1. Primary Distribution: NPM Registry

- **Mechanism**: Publish built artifacts to npm registry (`@re-cinq/bowman-ui`)
- **Trigger**: Git tags matching semver (`v*` pattern) on main branch
- **Authentication**: Organization npm token in CI secrets
- **Artifact**: Transpiled JS, TypeScript definitions, and source maps in dist/

### 2. Secondary: Lightweight Docker Image

- **Purpose**: Optional demo/documentation environment; not primary delivery
- **Base Image**: `node:22-alpine` for minimal footprint
- **Layers**:
  - Build stage: Install deps, build React components, generate Storybook
  - Runtime stage: Node minimal runtime serving static assets
- **Registry**: Organization container registry (ECR/Dockerhub)
- **Use Case**: Internal staging, documentation preview, integration testing

### 3. CI/CD Pipeline (GitHub Actions)

- **Test Phase**:
  - Run on all PRs and commits to main
  - ESLint, TypeScript compilation, Jest unit tests
  - Coverage thresholds enforced
- **Build Phase**:
  - Build React components and Storybook on PR merges to main
  - Generate Docker image on version tags
- **Publish Phase**:
  - NPM registry publish on semver tags
  - Container push on semver tags with image tag `latest` + semver
  - GitHub Releases auto-generated

### 4. Kubernetes (Optional)

- **Not Required for Library**: bowman-ui is a dependency, not a standalone application
- **Demo/Docs Deployment**: Storybook + component documentation deployable as Deployment + Service for internal review
- **Manifest Pattern**: `/k8s/` directory with base deployment template; consumers configure overlays per environment

### 5. Serverless (Out of Scope)

- No Lambda/Cloud Functions deployment needed; library has no runtime backend
- Consumers integrate components into their serverless functions

## Rationale

### Why NPM as Primary?

- **Direct Consumer Access**: React developers use `npm install @re-cinq/bowman-ui`; immediate access to latest version
- **Ecosystem Fit**: Standard Node.js/React distribution model
- **Minimal Overhead**: No infrastructure needed; npm handles CDN and versioning
- **Semantic Versioning**: Clear contract with consumers on breaking changes

### Why Containerization?

- **Documentation & Demo**: Storybook and component previews benefit from containerized, reproducible environment
- **Internal Staging**: QA and design review in Kubernetes namespaces before npm release
- **Consistency**: Same build artifacts tested locally (Docker) and in CI
- **Organization Standard**: Aligns with existing Kubernetes-based deployment infrastructure

### Why Not Monolithic Application Deployment?

- **Not an Application**: bowman-ui is a library; no server-side logic, authentication, or data stores
- **Reusability**: Consumers embed components in their own applications/lambdas
- **Decoupled Release**: Library lifecycle independent of consumer deployments

### Why Alpine + Multi-stage Build?

- **Size**: `node:22-alpine` ~150MB vs `node:22` ~900MB; reduces container registry costs and pull times
- **Security**: Minimal attack surface; fewer OS packages
- **Multi-stage Build**: Separates build toolchain (excluded in runtime image) from runtime dependencies

### Why GitHub Actions?

- **Native Integration**: GitHub-hosted workflows; no external CI tool procurement
- **Matrix Strategy**: Easy testing across Node versions, OS targets
- **Artifact Retention**: Built dist/ and Docker images stored as job artifacts or pushed to registries
- **Secret Management**: Org secrets for npm token, container registry credentials

## Consequences

### Positive

- ✅ **Immediate Consumer Access**: NPM publishes reach developers within minutes
- ✅ **Low Operational Burden**: Library requires no runtime infrastructure
- ✅ **Flexible Staging**: Container option available for demo/review without forcing Kubernetes deployment
- ✅ **Standard Tooling**: GitHub Actions, Docker, npm are industry standard
- ✅ **Clear Versioning**: Semver tags + NPM registry provide canonical version source

### Negative

- ⚠️ **Container Overhead**: Docker image is optional; may lead to inconsistency if Dockerization lags
- ⚠️ **Kubernetes Underutilized**: K8s deployment only for documentation; not full utilization of platform investment
- ⚠️ **Dual Artifact Management**: Both npm and container registry require monitoring and cleanup policies

### Mitigation

- Document Dockerfile and k8s manifests in README to clarify "optional" nature
- Automate container build alongside npm publish to keep artifacts in sync
- Set container registry retention policies (e.g., keep last 10 images)

## Implementation Details

### Dockerfile Location

```
Dockerfile
├── FROM node:22-alpine AS builder
├── WORKDIR /build
├── COPY package*.json ./
├── RUN npm ci
├── COPY . .
├── RUN npm run build
├── RUN npm run storybook:build
├── FROM node:22-alpine
├── COPY --from=builder /build/dist /app/dist
├── COPY --from=builder /build/storybook-static /app/public
├── CMD ["node", "-e", "require('http').createServer((req, res) => res.end('Ready')).listen(3000)"]
```

### CI Workflow Stages

```yaml
on:
  push:
    branches: [main]
    tags: ["v*"]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v3

  build:
    if: github.event_name == 'push' && github.ref_type == 'tag'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish-npm:
    if: github.event_name == 'push' && github.ref_type == 'tag'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-docker:
    if: github.event_name == 'push' && github.ref_type == 'tag'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ secrets.DOCKER_REGISTRY }}
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_REGISTRY }}/bowman-ui:${{ github.ref_name }}
            ${{ secrets.DOCKER_REGISTRY }}/bowman-ui:latest
```

### Kubernetes Manifest (Optional Demo)

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bowman-ui-docs
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bowman-ui-docs
  template:
    metadata:
      labels:
        app: bowman-ui-docs
    spec:
      containers:
        - name: docs
          image: org-registry/bowman-ui:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: bowman-ui-docs
spec:
  selector:
    app: bowman-ui-docs
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Alternatives Considered

1. **NPM-Only (No Containers)**
   - Rejected: Removes flexibility for internal staging and demo environments

2. **Monolithic Application Deployment**
   - Rejected: bowman-ui is a library; deploying as standalone app adds unnecessary complexity

3. **Serverless Distribution (Lambda@Edge, CloudFront)**
   - Rejected: Out-of-scope; consumers integrate components into their own deployment models

## Related ADRs

- ADR-001: Repository Structure & Build Tooling
- ADR-002: Component Architecture & Testing Strategy

## References

- [npm Registry Docs](https://docs.npmjs.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [GitHub Actions: Publishing Packages](https://docs.github.com/en/actions/publishing-packages)
