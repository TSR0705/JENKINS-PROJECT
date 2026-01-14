# Jenkinsfile Changes Summary

## WHAT WAS BROKEN

### 1. Missing Docker Socket Mount
**Problem:** Platform container couldn't spawn user job containers
**Impact:** User jobs would fail with "Cannot connect to Docker daemon"
**Fix:** Added `-v /var/run/docker.sock:/var/run/docker.sock`

### 2. Missing Restart Policy
**Problem:** Platform container wouldn't survive VM reboot
**Impact:** Service downtime after reboot
**Fix:** Added `--restart unless-stopped`

### 3. Missing Logs Volume
**Problem:** Logs lost when container recreated
**Impact:** No historical logs for debugging
**Fix:** Added `-v $(pwd)/logs:/app/logs`

### 4. Runner Image Not Built
**Problem:** `openci-runner-image` didn't exist
**Impact:** User jobs fail with "image not found"
**Fix:** Added stage to build runner image from `Dockerfile.runner`

### 5. No Deployment Verification
**Problem:** Deployment could fail silently
**Impact:** Broken deployments go unnoticed
**Fix:** Added health check stage with `curl -f http://localhost:3000/health`

### 6. No Image Cleanup
**Problem:** Old images accumulate
**Impact:** Disk space exhaustion
**Fix:** Added `docker image prune -f` stage

### 7. Poor Error Handling
**Problem:** No logs on failure
**Impact:** Hard to debug failed deployments
**Fix:** Added `post` block with failure logging

---

## CHANGES MADE

### Added Stages:
1. **Build Runner Image** - Builds user job execution environment
2. **Verify Deployment** - Health check after deployment
3. **Cleanup Old Images** - Removes dangling images

### Modified Stages:
1. **Deploy Platform** - Added Docker socket mount, restart policy, logs volume
2. **Stop Old Platform** - Improved error handling with `2>/dev/null`

### Added Sections:
1. **Environment Variables** - Centralized configuration
2. **Post Actions** - Failure logging and status reporting

---

## BEFORE vs AFTER

### BEFORE (Broken)
```groovy
stage('Deploy') {
    steps {
        sh '''
            docker stop openci-platform || true
            docker rm openci-platform || true
            docker run -d --name openci-platform -p 3000:3000 openci-platform:latest
        '''
    }
}
```

**Issues:**
- ❌ No Docker socket access
- ❌ No restart policy
- ❌ No logs persistence
- ❌ No verification
- ❌ Runner image not built

### AFTER (Fixed)
```groovy
stage('Build Runner Image') {
    steps {
        script {
            sh 'docker build -t ${RUNNER_IMAGE}:latest -f src/docker/Dockerfile.runner .'
        }
    }
}

stage('Deploy Platform') {
    steps {
        script {
            sh '''
                docker run -d \
                  --name ${PLATFORM_CONTAINER} \
                  --restart unless-stopped \
                  -p ${PLATFORM_PORT}:3000 \
                  -v /var/run/docker.sock:/var/run/docker.sock \
                  -v $(pwd)/logs:/app/logs \
                  ${PLATFORM_IMAGE}:latest
            '''
        }
    }
}

stage('Verify Deployment') {
    steps {
        script {
            sh '''
                sleep 5
                curl -f http://localhost:${PLATFORM_PORT}/health || exit 1
            '''
        }
    }
}
```

**Improvements:**
- ✅ Docker socket mounted
- ✅ Restart policy set
- ✅ Logs persisted
- ✅ Health check verification
- ✅ Runner image built
- ✅ Environment variables
- ✅ Error handling

---

## TESTING THE CHANGES

### 1. Test Platform Deployment
```bash
# Trigger Jenkins build
git push origin main

# Wait for build to complete
# Verify platform is running
docker ps | grep openci-platform

# Verify health endpoint
curl http://localhost:3000/health
```

### 2. Test User Job Execution
```bash
# Submit test repository via web UI
# Example: https://github.com/username/test-repo

# Verify job executes
# Check logs at http://localhost:3000/job/{jobId}

# Verify container cleanup
docker ps -a | grep -v openci-platform
# Should not show leftover user containers
```

### 3. Test VM Reboot
```bash
# Reboot VM
sudo reboot

# After reboot, verify platform auto-started
docker ps | grep openci-platform

# Verify platform is functional
curl http://localhost:3000/health
```

### 4. Test Failure Recovery
```bash
# Kill platform container
docker kill openci-platform

# Wait 10 seconds
sleep 10

# Verify Docker restarted it
docker ps | grep openci-platform
```

---

## ROLLBACK PROCEDURE

If deployment fails:

```bash
# Check Jenkins logs
cat /var/log/jenkins/jenkins.log

# Check platform container logs
docker logs openci-platform

# Manual rollback to previous image
docker stop openci-platform
docker rm openci-platform
docker run -d \
  --name openci-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/logs:/app/logs \
  openci-platform:previous

# Verify health
curl http://localhost:3000/health
```

---

## FUTURE CONSIDERATIONS (NOT IMPLEMENTED)

These are intentionally NOT included to keep the system simple:

- ❌ Blue-green deployment
- ❌ Rolling updates
- ❌ Load balancing
- ❌ Container orchestration (Kubernetes)
- ❌ Image versioning/tagging
- ❌ Secrets management
- ❌ Multi-stage rollback
- ❌ Automated rollback on failure

**Reason:** This is a demo platform. Current approach is sufficient.
