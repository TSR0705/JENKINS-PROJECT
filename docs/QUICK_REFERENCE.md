# OpenCI Runner - Quick Reference Guide

## 🚀 DEPLOYMENT

### Deploy via Jenkins
```bash
# Jenkins automatically triggers on git push
git push origin main

# Or manually trigger in Jenkins UI
# Job: openci-runner-pipeline
```

### Manual Deployment (Emergency)
```bash
# Build images
docker build -t openci-runner-image:latest -f src/docker/Dockerfile.runner .
docker build -t openci-platform:latest .

# Stop old platform
docker stop openci-platform 2>/dev/null || true
docker rm openci-platform 2>/dev/null || true

# Start new platform
docker run -d \
  --name openci-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/logs:/app/logs \
  openci-platform:latest

# Verify
curl http://localhost:3000/health
```

---

## 🔍 MONITORING

### Check Platform Status
```bash
# Is platform running?
docker ps | grep openci-platform

# Platform logs
docker logs -f openci-platform

# Platform resource usage
docker stats openci-platform
```

### Check User Jobs
```bash
# View job logs (file)
tail -f logs/combined.log

# View job logs (web)
http://localhost:3000/job/{jobId}

# Check for orphaned containers
docker ps -a | grep -v openci-platform
```

### Check System Health
```bash
# Health endpoint
curl http://localhost:3000/health

# Disk space
df -h

# Docker disk usage
docker system df
```

---

## 🐛 TROUBLESHOOTING

### Platform Won't Start
```bash
# Check logs
docker logs openci-platform

# Check if port is in use
netstat -tulpn | grep 3000

# Check Docker socket
ls -la /var/run/docker.sock

# Restart Docker daemon
sudo systemctl restart docker
```

### User Jobs Failing
```bash
# Check runner image exists
docker images | grep openci-runner-image

# Test runner image manually
docker run --rm openci-runner-image node --version
docker run --rm openci-runner-image python3 --version

# Check platform has Docker access
docker exec openci-platform docker ps
```

### Platform Not Restarting After Reboot
```bash
# Check restart policy
docker inspect openci-platform | grep -A 5 RestartPolicy

# Manually restart
docker restart openci-platform

# Check Docker service
sudo systemctl status docker
```

### Disk Space Full
```bash
# Remove stopped containers
docker container prune -f

# Remove dangling images
docker image prune -f

# Remove old logs
rm -f logs/*.log

# Check space
docker system df
```

---

## 🧪 TESTING

### Test Platform Locally
```bash
# Install dependencies
npm install

# Run tests
npm test

# Start platform
npm start

# Test health endpoint
curl http://localhost:3000/health
```

### Test User Job Flow
```bash
# Submit test repository
# Example: https://github.com/username/test-node-app

# Monitor execution
docker ps -a

# Check logs
tail -f logs/combined.log

# Verify cleanup
docker ps -a | grep -v openci-platform
```

### Test VM Reboot Recovery
```bash
# Reboot VM
sudo reboot

# After reboot, verify platform started
docker ps | grep openci-platform

# Verify functionality
curl http://localhost:3000/health
```

---

## 📊 USEFUL COMMANDS

### Docker
```bash
# List all containers
docker ps -a

# List all images
docker images

# Remove container
docker rm -f <container_name>

# Remove image
docker rmi <image_name>

# View container logs
docker logs <container_name>

# Execute command in container
docker exec <container_name> <command>

# Inspect container
docker inspect <container_name>

# Container resource usage
docker stats
```

### Platform Management
```bash
# Restart platform
docker restart openci-platform

# Stop platform
docker stop openci-platform

# Start platform
docker start openci-platform

# View platform logs (last 100 lines)
docker logs --tail 100 openci-platform

# Follow platform logs
docker logs -f openci-platform
```

### System
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tulpn

# Check running processes
ps aux | grep node
```

---

## 🔐 SECURITY CHECKS

### Verify Isolation
```bash
# User containers should have no network
docker inspect <user_container> | grep NetworkMode
# Should show: "none"

# User containers should have resource limits
docker inspect <user_container> | grep -A 10 HostConfig
# Should show memory and CPU limits

# User containers should run as non-root
docker inspect <user_container> | grep User
# Should show: "runner"
```

### Verify Cleanup
```bash
# No stopped user containers
docker ps -a --filter "status=exited" | grep -v openci-platform
# Should be empty

# No dangling images
docker images --filter "dangling=true"
# Should be minimal
```

---

## 📝 LOGS

### Platform Logs
```bash
# Docker logs
docker logs openci-platform

# File logs
tail -f logs/combined.log
tail -f logs/error.log

# Jenkins logs
cat /var/log/jenkins/jenkins.log
```

### User Job Logs
```bash
# Via web UI
http://localhost:3000/job/{jobId}

# Via file
grep "jobId" logs/combined.log
```

---

## 🔄 MAINTENANCE

### Daily
```bash
# Check platform status
docker ps | grep openci-platform

# Check disk space
df -h

# Check for errors
tail -100 logs/error.log
```

### Weekly
```bash
# Clean up old containers
docker container prune -f

# Clean up old images
docker image prune -f

# Rotate logs
mv logs/combined.log logs/combined.log.old
mv logs/error.log logs/error.log.old
```

### Monthly
```bash
# Full system cleanup
docker system prune -a -f

# Check for updates
git pull origin main

# Redeploy via Jenkins
```

---

## 🆘 EMERGENCY PROCEDURES

### Platform Completely Down
```bash
# 1. Check Docker daemon
sudo systemctl status docker
sudo systemctl restart docker

# 2. Check if container exists
docker ps -a | grep openci-platform

# 3. Restart container
docker restart openci-platform

# 4. If restart fails, redeploy
docker stop openci-platform
docker rm openci-platform
# Run manual deployment commands (see top of document)

# 5. Verify
curl http://localhost:3000/health
```

### Jenkins Pipeline Failing
```bash
# 1. Check Jenkins logs
cat /var/log/jenkins/jenkins.log

# 2. Check Docker access
docker ps

# 3. Check disk space
df -h

# 4. Manual deployment
# See "Manual Deployment" section above

# 5. Fix issue and re-run pipeline
```

### VM Unresponsive
```bash
# 1. SSH into VM
ssh user@vm-ip

# 2. Check system resources
top
df -h
free -h

# 3. Check Docker
sudo systemctl status docker

# 4. Restart Docker if needed
sudo systemctl restart docker

# 5. Restart platform
docker restart openci-platform
```

---

## 📞 SUPPORT

### Documentation
- Architecture: `docs/CI_CD_ARCHITECTURE.md`
- Verification: `docs/JENKINS_VERIFICATION.md`
- Changes: `docs/JENKINSFILE_CHANGES.md`
- Summary: `docs/EXECUTIVE_SUMMARY.md`

### Key Files
- Platform: `Dockerfile`
- Runner: `src/docker/Dockerfile.runner`
- Pipeline: `Jenkinsfile`
- Tests: `tests/`

### Endpoints
- Health: `http://localhost:3000/health`
- Home: `http://localhost:3000/`
- Job: `http://localhost:3000/job/{jobId}`
- Job JSON: `http://localhost:3000/job/{jobId}/json`
