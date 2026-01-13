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
  executeJob(job)
    .then(result => {
      job.logs = result.logs;
      job.status = result.success ? 'PASS' : 'FAIL';
      
      // Clean up work directory after execution
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
      job.workDir = null;
    })
    .catch(err => {
      job.logs.push(err.message);
      job.status = 'FAIL';
      
      // Clean up work directory after execution
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

  res.render('job', { job });
};

module.exports = {
  createJobHandler,
  getJobHandler
};
