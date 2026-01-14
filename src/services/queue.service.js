const { executeJob } = require('./runner.service');
const fs = require('fs');

const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '1', 10);
const jobQueue = [];
let runningJobs = 0;

const rateLimitMap = new Map();
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '5', 10);
const RATE_LIMIT_WINDOW_MS = 60000;

// Cleanup old rate limit entries every 5 minutes
const RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60 * 1000;

let rateLimitCleanupInterval = null;

const cleanupRateLimitMap = () => {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const recentRequests = timestamps.filter(timestamp => timestamp > cutoff);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recentRequests);
    }
  }
};

// Start cleanup interval (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  rateLimitCleanupInterval = setInterval(cleanupRateLimitMap, RATE_LIMIT_CLEANUP_INTERVAL);
}

const stopCleanup = () => {
  if (rateLimitCleanupInterval) {
    clearInterval(rateLimitCleanupInterval);
    rateLimitCleanupInterval = null;
  }
};

const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
};

const enqueueJob = (job, workDir, ip) => {
  if (!checkRateLimit(ip)) {
    return { success: false, error: 'Rate limit exceeded. Maximum 5 jobs per minute allowed.' };
  }
  
  jobQueue.push({ job, workDir });
  processQueue();
  return { success: true };
};

const processQueue = () => {
  if (runningJobs >= MAX_CONCURRENT_JOBS || jobQueue.length === 0) {
    return;
  }
  
  const { job, workDir } = jobQueue.shift();
  runningJobs++;
  job.status = 'RUNNING';
  job.startedAt = new Date().toISOString();
  job.workDir = workDir;
  
  executeJob(job)
    .then(result => {
      job.completedAt = new Date().toISOString();
      job.logs = result.logs;
      if (result.timeout) {
        job.status = 'TIMEOUT';
      } else {
        job.status = result.success ? 'PASS' : 'FAIL';
      }
      
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
      job.workDir = null;
      
      runningJobs--;
      processQueue();
    })
    .catch(err => {
      job.completedAt = new Date().toISOString();
      job.logs = job.logs || [];
      job.logs.push(err.message);
      job.status = 'FAIL';
      
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
      job.workDir = null;
      
      runningJobs--;
      processQueue();
    })
    .catch(err => {
      // Final catch to prevent unhandled rejection
      console.error('Critical error in processQueue:', err);
      runningJobs--;
      processQueue();
    });
};

const getQueueStatus = () => {
  return {
    queueLength: jobQueue.length,
    runningJobs: runningJobs,
    maxConcurrent: MAX_CONCURRENT_JOBS
  };
};

module.exports = {
  enqueueJob,
  getQueueStatus,
  stopCleanup
};