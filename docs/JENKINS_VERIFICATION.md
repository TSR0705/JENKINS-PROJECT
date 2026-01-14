# Jenkins Pipeline Verification Checklist

## ✅ VERIFY JENKINS IS WIRED CORRECTLY

### 1. Jenkins Configuration
```bash
# Verify Jenkins has Docker access
docker ps

# Verify Jenkins can build images
docker build --help
```

### 2. Pipeline Execution
```bash
# After Jenkins runs, verify platform container is running
docker ps | grep openci-platform

# Verify restart policy is set
docker inspect openci-platform | grep -A 5 RestartPolicy

# Verify Docker socket is mounted
docker inspect openci-platform | grep docker.sock

# Verify logs volume is mounted
docker inspect openci-platform | grep -A 10 Mounts
```

### 3. Platform Health
```bash
# Verify platform is accessible
curl http://localhost:3000/health

# Verify platform responds to web requests
curl http://localhost:3000/
```

### 4. Runner Image Exists
```bash
# Verify runner image was built
docker images | grep openci-runner-image
```

### 5. VM Reboot Test
```bash
# Reboot VM
sudo reboot

# After reboot, verify platform auto-started
docker ps | grep openci-platform
```

---

## ✅ VERIFY JENKINS IS NOT AFFECTING RUNTIME CI

### 1. User Job Execution
```bash
# Submit a test repository via web UI
# Monitor that job executes independently

# Verify user containers are spawned by platform, not Jenkins
docker ps -a | grep -v openci-platform | grep -v openci-runner-image
```

### 2. Jenkins Process Isolation
```bash
# Verify Jenkins is not running user code
ps aux | grep jenkins | grep -v "docker\|npm\|node"

# Verify Jenkins only manages platform container
docker ps --filter "label=com.jenkins" || echo "No Jenkins-managed user containers"
```

### 3. User Container Lifecycle
```bash
# Submit job via UI
# Verify container is created by Node.js process (not Jenkins)
docker events --filter 'type=container' &

# Submit job and watch events
# Should see: container create -> container start -> container die -> container destroy
# All triggered by openci-platform container, not Jenkins
```

### 4. Log Separation
```bash
# Verify user job logs are in platform logs, not Jenkins logs
tail -f logs/combined.log

# Jenkins logs should only show platform deployment
cat /var/log/jenkins/jenkins.log | grep -i "user\|repository\|clone"
# Should return nothing related to user jobs
```

---

## 🚨 RED FLAGS (MUST NOT HAPPEN)

- ❌ Jenkins executing `git clone` of user repositories
- ❌ Jenkins spawning user job containers
- ❌ Jenkins logs containing user repository URLs
- ❌ User job failures causing Jenkins build failures
- ❌ Jenkins exposed on public port
- ❌ User containers running with Jenkins labels

---

## ✅ EXPECTED BEHAVIOR

### Jenkins Pipeline (Platform CI/CD)
1. Triggered by git push to OpenCI Runner repo
2. Runs platform tests (Jest)
3. Builds platform image (Dockerfile)
4. Builds runner image (Dockerfile.runner)
5. Deploys platform container
6. Verifies health endpoint
7. Exits successfully

### User Job Flow (Runtime CI)
1. User submits GitHub URL via web form
2. Platform container clones repo
3. Platform container detects project type
4. Platform container spawns isolated runner container
5. Runner container executes tests
6. Platform container captures results
7. Platform container updates job status
8. Runner container auto-removed
9. User sees results via web UI

---

## 📊 MONITORING COMMANDS

```bash
# Watch platform logs
docker logs -f openci-platform

# Watch user job execution
tail -f logs/combined.log

# Monitor container lifecycle
docker events --filter 'type=container' --filter 'event=create' --filter 'event=destroy'

# Check resource usage
docker stats openci-platform

# Verify no orphaned containers
docker ps -a --filter "status=exited" | grep -v openci-platform
```
