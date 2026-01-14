🚀 OpenCI Runner — COMPLETE PROJECT IDEA & FLOW
🧠 WHAT THIS PROJECT IS (ONE-LINER)

OpenCI Runner is a public CI demo platform where anyone can submit a public GitHub repository and receive real test and lint results executed inside secure, isolated Docker containers, while Jenkins is used privately to CI/CD the platform itself.

No fake logs. No screenshots. Real execution.

❌ PROBLEM IT SOLVES
In the real world:

Students fake CI screenshots

CI/CD is invisible and abstract

Jenkins demos are private and boring

Recruiters can’t verify CI claims

What OpenCI Runner changes:

CI becomes public and verifiable

Anyone can try it

Results are real, not simulated

Jenkins is used correctly, not abused

👥 WHO USES WHAT (CRITICAL SEPARATION)
Actor	Responsibility
Public Users	Submit GitHub repo, view CI results
OpenCI Runner Platform	Manages jobs, isolation, execution
Docker Runner	Executes untrusted user code safely
Jenkins	CI/CD for the platform itself (private)
You (Developer)	Write code → Jenkins deploys

👉 Users never touch Jenkins
👉 Jenkins never touches user code

This separation is the backbone of the project.

🧱 HIGH-LEVEL SYSTEM ARCHITECTURE
User CI Flow (Public)
User Browser
    ↓
OpenCI Runner Web App
    ↓
Job Controller
    ↓
Queue (1 job at a time)
    ↓
Docker Runner (isolated)
    ↓
Tests + Lint
    ↓
Logs + Status
    ↓
Public Result Page

Platform CI Flow (Private)
You push code
    ↓
Jenkins Pipeline
    ↓
Test Platform
    ↓
Build Docker Image
    ↓
Deploy to VM
    ↓
Platform Updated Live


Two CI systems. Two purposes. Never mixed.

🧩 COMPLETE USER FLOW (STEP BY STEP)

User opens:

http://<public-vm-ip>:3000


User pastes a public GitHub repo URL

Clicks Run CI

Platform:

Creates a Job

Applies rate limit

Adds job to queue

When job starts:

Repo is cloned

Project type detected (Node / Python)

Docker container is started

Tests + lint executed

Logs captured

Container destroyed

User sees:

PASS / FAIL / TIMEOUT

Execution duration

Timestamp

Full raw logs

Shareable public URL

Everything is real.

⚙️ WHAT CI ACTUALLY RUNS (NO MAGIC)
Supported languages (ONLY):
Node.js

Detected by:

package.json

test script

Commands:

npm install
npm test
npm run lint || true

Python

Detected by:

requirements.txt

test files

Commands:

pip install -r requirements.txt
pytest
flake8 || true


❌ No AI
❌ No fake bug detection
❌ No extra languages

🔐 SECURITY MODEL (NON-NEGOTIABLE)

Every user job runs with:

New Docker container

--network=none

CPU & memory limits

Read-only filesystem

No capabilities

Non-root user

Hard timeout (120s)

Auto-destroy container

Example (conceptually):

docker run --rm \
  --network=none \
  --memory=512m \
  --cpus=1 \
  --read-only \
  --cap-drop=ALL \
  openci-runner-image


If this isolation didn’t exist, the project would be unsafe.
You did not skip this.

🚦 STABILITY CONTROLS

To prevent abuse and crashes:

Max 1 concurrent job

FIFO queue

Per-IP rate limiting (5 jobs/min)

No parallel execution

No background chaos

Result:
✔ VM stays alive
✔ Docker doesn’t storm
✔ Predictable behavior

🤖 WHERE JENKINS IS USED (THIS IS THE KEY INTERVIEW POINT)
Jenkins is used ONLY for:

Testing OpenCI Runner

Building platform Docker image

Deploying platform to VM

Keeping build history

Jenkins is NEVER used for:

User repositories

Running user tests

Accepting Jenkinsfiles

Public access

Correct usage. Mature design.

🔁 YOUR DEV FLOW (REAL CI/CD)
You write code
   ↓
git push
   ↓
Jenkins pipeline runs
   ↓
Platform tests
   ↓
Docker image built
   ↓
Old container stopped
   ↓
New container deployed
   ↓
Users see update live


This proves actual DevOps skill, not theory.

☁️ DEPLOYMENT MODEL

Oracle Cloud Free Tier VM

Docker installed

Jenkins running privately

OpenCI Runner container exposed on port 3000

Public IP accessible

Auto-restart on reboot

No fake local demos.
No screenshots.
Live system.

🧾 WHAT MAKES THIS A STRONG PROJECT

Public & usable

Real execution

Safe isolation

Correct Jenkins usage

Clear boundaries

Recruiter can verify instantly

No overclaiming

Most students cannot explain such a system end-to-end.
You can.

❌ WHAT YOU MUST NEVER CLAIM

❌ “We replace Jenkins”

❌ “AI-powered CI”

❌ “Supports all languages”

❌ “Enterprise-grade”

❌ “Production CI alternative”

Honesty = credibility.

🏁 FINAL SUMMARY (MEMORIZE THIS)

OpenCI Runner is a public CI demo platform that allows users to submit GitHub repositories and receive real test and lint results executed inside isolated Docker containers. Jenkins is used privately to continuously test, build, and deploy the platform itself, demonstrating correct CI/CD practices with strong security boundaries.

That is clean, honest, and interview-proof.