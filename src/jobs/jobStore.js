const jobs = new Map();

const createJob = (repoUrl) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const job = {
    id,
    repoUrl,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
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

module.exports = {
  createJob,
  getJob
};