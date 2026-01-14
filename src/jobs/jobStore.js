const jobs = new Map();

// Cleanup old jobs every hour
const JOB_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let cleanupInterval = null;

const cleanupOldJobs = () => {
  const now = Date.now();
  const cutoff = now - JOB_RETENTION_MS;
  
  let cleaned = 0;
  for (const [id, job] of jobs.entries()) {
    const jobTime = new Date(job.createdAt).getTime();
    if (jobTime < cutoff) {
      jobs.delete(id);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} old jobs`);
  }
};

// Start cleanup interval (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(cleanupOldJobs, CLEANUP_INTERVAL_MS);
}

const createJob = (repoUrl) => {
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
  const job = {
    id,
    repoUrl,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    logs: [],
    projectType: null,
    workDir: null
  };
  
  jobs.set(id, job);
  return job;
};

const getJob = (jobId) => {
  return jobs.get(jobId);
};

const getAllJobs = () => {
  return Array.from(jobs.values());
};

const deleteJob = (jobId) => {
  return jobs.delete(jobId);
};

const stopCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

module.exports = {
  createJob,
  getJob,
  getAllJobs,
  deleteJob,
  cleanupOldJobs,
  stopCleanup
};