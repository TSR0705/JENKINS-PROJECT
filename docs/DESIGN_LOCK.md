
# OpenCI Runner — Design Lock

## 1. What This Project Is
OpenCI Runner is a public CI demo platform where users submit public GitHub repositories and receive real test and lint results executed inside isolated Docker containers. Jenkins is used internally to CI/CD the platform itself.

## 2. Who Uses What
- Users: Submit GitHub repo URLs and view CI results
- Platform: Controls jobs and Docker execution
- Docker Runners: Execute untrusted user code in isolation
- Jenkins: Tests, builds, and deploys OpenCI Runner (never user code)

## 3. Supported Languages
- Node.js (package.json + tests)
- Python (requirements.txt + pytest)

## 4. CI Steps (User Code)
- Clone repo
- Detect language
- Install dependencies
- Run tests
- Run lint (non-blocking)
- Capture logs
- Destroy container

## 5. Security Rules
- New Docker container per job
- No network access
- CPU & memory limits
- Hard timeout
- Non-root user
- Container auto-destroyed
- No secrets

## 6. What We Will NOT Build
- No user accounts
- No Jenkins for users
- No AI analysis
- No YAML pipelines
- No multiple languages
- No Kubernetes
