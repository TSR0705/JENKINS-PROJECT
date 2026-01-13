const { createJob, getJob } = require('../jobs/jobStore');
const { cloneRepo } = require('../services/clone.service');
const { detectProjectType } = require('../services/detect.service');
const { executeJob } = require('../services/runner.service');
const fs = require('fs');

const createJobHandler = async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).send('Repository URL is required');
  }

  const job = createJob(repoUrl);
  job.status = 'PENDING';
  job.projectType = null;
  job.workDir = null;

  let workDir = null;

  try {
    workDir = await cloneRepo(repoUrl);
    job.workDir = workDir;

    const projectType = detectProjectType(workDir);
    job.projectType = projectType;

    if (projectType === null) {
      job.status = 'FAILED';

      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }

      job.workDir = null;
      
      res.redirect(`/job/${job.id}`);
      return;
    } else {
      // Start job execution in the background
      startJobExecution(job, workDir);
    }
  } catch (error) {
    job.status = 'FAILED';

    if (workDir && fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }

    job.workDir = null;
  }

  res.redirect(`/job/${job.id}`);
}

const startJobExecution = (job, workDir) => {
  job.startedAt = new Date().toISOString();
  
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
    })
    .catch(err => {
      job.completedAt = new Date().toISOString();
      job.logs.push(err.message);
      job.status = 'FAIL';
      
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
      job.workDir = null;
    });
};

const getJobHandler = (req, res) => {
  const jobId = req.params.id;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).render('error', { message: 'Job not found' });
  }

  let duration = null;
  if (job.startedAt && job.completedAt) {
    const start = new Date(job.startedAt);
    const end = new Date(job.completedAt);
    duration = Math.round((end - start) / 1000);
  }

  const jobData = {
    ...job,
    duration
  };

  res.render('job', { job: jobData });
};

module.exports = {
  createJobHandler,
  getJobHandler
};
