# OpenCI Runner - CI/CD Architecture

## SYSTEM OVERVIEW

OpenCI Runner has **TWO STRICTLY SEPARATED FLOWS**:

---

## 1. USER CI FLOW (RUNTIME)

**Purpose:** Execute user-submitted repository tests in isolation

**Technology Stack:**
- Node.js + Express (platform backend)
- Docker (container isolation)
- In-memory job store

**Flow:**
```
User submits GitHub URL
    ↓
Express receives POST /
    ↓
Clone repo to temp directory
    ↓
Detect project type (node/python)
    ↓
Enqueue job (rate limited)
    ↓
Spawn Docker container with --rm
    ↓
Execute test commands inside container
    ↓
Capture stdout/stderr
    ↓
Detect exit code (0 = PASS, non-zero = FAIL)
    ↓
Container auto-removed
    ↓
Update job status in memory
    ↓
Frontend polls /job/:id/json
    ↓
User sees PASS/FAIL/TIMEOUT
```

**Key Files:**
- `src/services/runner.service.js` - Docker execution
- `src/services/queue.service.js` - Job queue + rate limiting
- `src/controllers/job.controller.js` - HTTP handlers
- `src/jobs/jobStore.js` - In-memory job storage

**Container Specs:**
- Image: `openci-runner-image`
- Network: `--network=none` (isolated)
- Memory: `--memory=512m`
- CPU: `--cpus=1`
- Security: `--cap-drop=ALL --user runner`
- Cleanup: `--rm` (auto-remove)

**Jenkins Involvement:** ❌ NONE

---

## 2. PLATFORM CI/CD FLOW (JENKINS)

**Purpose:** Build, test, and deploy OpenCI Runner platform itself

**Technology Stack:**
- Jenkins (CI/CD orchestration)
- Docker (image building + deployment)
- Jest (platform testing)

**Flow:**
```
Developer pushes to OpenCI Runner repo
    ↓
Jenkins webhook triggered
    ↓
Checkout code
    ↓
npm install
    ↓
npm test (platform tests)
    ↓
Build openci-runner-image (Dockerfile.runner)
    ↓
Build openci-platform (Dockerfile)
    ↓
Stop old platform container
    ↓
Start new platform container with:
  - Docker socket mount
  - Restart policy
  - Logs volume
  - Health check
    ↓
Verify deployment via /health
    ↓
Cleanup old images
```

**Key Files:**
- `Jenkinsfile` - Pipeline definition
- `Dockerfile` - Platform image
- `src/docker/Dockerfile.runner` - User runner image
- `package.json` - Dependencies + test scripts

**User Job Involvement:** ❌ NONE

---

## CRITICAL SEPARATION RULES

### ✅ JENKINS MUST:
- Build OpenCI Runner platform image
- Build user runner base image
- Deploy platform container
- Run platform tests
- Manage platform lifecycle

### ❌ JENKINS MUST NOT:
- Clone user repositories
- Execute user code
- Spawn user job containers
- Accept public input
- Manage user job lifecycle
- Be exposed publicly

### ✅ PLATFORM (Node.js) MUST:
- Accept user repository URLs
- Clone user repositories
- Detect project types
- Spawn user job containers
- Capture user job logs
- Update job status
- Serve web UI

### ❌ PLATFORM MUST NOT:
- Trigger Jenkins builds
- Modify Jenkins configuration
- Deploy itself
- Build Docker images

---

## DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                         VM                              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Jenkins (Private)                   │  │
│  │  - Builds platform image                         │  │
│  │  - Builds runner image                           │  │
│  │  - Deploys platform container                    │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          │ deploys                      │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │      openci-platform Container (Public)          │  │
│  │  - Express web server (port 3000)                │  │
│  │  - Accepts user GitHub URLs                      │  │
│  │  - Spawns user job containers                    │  │
│  │  - Mounts: /var/run/docker.sock                  │  │
│  │  - Restart: unless-stopped                       │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          │ spawns                       │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │   User Job Containers (Ephemeral)                │  │
│  │  - Image: openci-runner-image                    │  │
│  │  - Network: none                                 │  │
│  │  - Memory: 512m                                  │  │
│  │  - Auto-removed after execution                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## VERIFICATION

See `docs/JENKINS_VERIFICATION.md` for complete verification checklist.

**Quick Checks:**

```bash
# Platform is running
docker ps | grep openci-platform

# Platform has Docker access
docker exec openci-platform docker ps

# Platform restarts on reboot
docker inspect openci-platform | grep -A 5 RestartPolicy

# Runner image exists
docker images | grep openci-runner-image

# Health check passes
curl http://localhost:3000/health
```

---

## SECURITY BOUNDARIES

| Component | Network | Privileges | Persistence |
|-----------|---------|------------|-------------|
| Jenkins | Private | Docker access | Persistent |
| Platform Container | Public (port 3000) | Docker socket | Persistent |
| User Job Container | None | Minimal (runner user) | Ephemeral |

---

## FAILURE SCENARIOS

### Platform Container Crashes
- **Detection:** Health check fails
- **Recovery:** Restart policy auto-restarts
- **Manual:** `docker restart openci-platform`

### User Job Timeout
- **Detection:** 120s timeout in runner.service.js
- **Recovery:** Container killed, status set to TIMEOUT
- **Cleanup:** Container auto-removed via --rm

### VM Reboot
- **Detection:** Platform container not running
- **Recovery:** Docker restart policy starts container
- **Verification:** `docker ps | grep openci-platform`

### Jenkins Build Failure
- **Detection:** Pipeline stage fails
- **Recovery:** Manual investigation, fix code, re-run
- **Impact:** Platform continues running old version

---

## MAINTENANCE

### Update Platform Code
1. Push changes to repo
2. Jenkins auto-builds and deploys
3. Zero-downtime not guaranteed (acceptable for demo)

### Update Runner Image
1. Modify `src/docker/Dockerfile.runner`
2. Push changes
3. Jenkins rebuilds runner image
4. New user jobs use new image

### View Logs
```bash
# Platform logs
docker logs -f openci-platform

# User job logs (via web UI)
http://localhost:3000/job/{jobId}

# File logs
tail -f logs/combined.log
```

### Cleanup
```bash
# Remove stopped containers
docker container prune -f

# Remove dangling images
docker image prune -f

# Remove old logs
rm -f logs/*.log
```
