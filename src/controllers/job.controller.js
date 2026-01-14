const { createJob, getJob } = require('../jobs/jobStore');
const { cloneRepo } = require('../services/clone.service');
const { detectProjectType } = require('../services/detect.service');
const { enqueueJob } = require('../services/queue.service');
const { validateRepoUrl, isValidJobId } = require('../utils/validator');
const logger = require('../utils/logger');
const fs = require('fs');

const createJobHandler = async (req, res) => {
  const { repoUrl } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
  
  logger.info('Job creation requested', { repoUrl, clientIp });
  
  let sanitizedUrl;
  try {
    sanitizedUrl = validateRepoUrl(repoUrl);
  } catch (error) {
    logger.warn('Job creation failed: invalid URL', { repoUrl, clientIp, error: error.message });
    return res.status(400).render('error', { message: error.message });
  }
  
  const job = createJob(sanitizedUrl);
  job.status = 'PENDING';
  job.projectType = null;
  job.workDir = null;

  logger.info('Job created', { jobId: job.id, repoUrl: sanitizedUrl, clientIp });

  let workDir = null;

  try {
    logger.info('Starting repository clone', { jobId: job.id });
    workDir = await cloneRepo(sanitizedUrl);
    job.workDir = workDir;

    logger.info('Repository cloned successfully', { jobId: job.id, workDir });

    const projectType = detectProjectType(workDir);
    job.projectType = projectType;

    logger.info('Project type detected', { jobId: job.id, projectType });

    if (projectType === null) {
      job.status = 'FAILED';
      logger.warn('Job failed: unsupported project type', { jobId: job.id });

      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }

      job.workDir = null;
      
      res.redirect(`/job/${job.id}`);
      return;
    } else {
      const queueResult = enqueueJob(job, workDir, clientIp);
      if (!queueResult.success) {
        job.status = 'FAILED';
        logger.warn('Job failed: rate limit exceeded', { jobId: job.id, clientIp });
        if (fs.existsSync(workDir)) {
          fs.rmSync(workDir, { recursive: true, force: true });
        }
        job.workDir = null;
        return res.status(429).render('error', { message: queueResult.error });
      }
      logger.info('Job enqueued successfully', { jobId: job.id });
    }
  } catch (error) {
    job.status = 'FAILED';
    job.logs = [`Error: ${error.message}`];
    logger.error('Job creation failed', { jobId: job.id, error: error.message, stack: error.stack });

    if (workDir && fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }

    job.workDir = null;
  }

  res.redirect(`/job/${job.id}`);
};

const getJobHandler = (req, res) => {
  const jobId = req.params.id;
  
  if (!isValidJobId(jobId)) {
    logger.warn('Invalid job ID requested', { jobId });
    return res.status(400).render('error', { message: 'Invalid job ID' });
  }
  
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

const getJobJsonHandler = (req, res) => {
  const jobId = req.params.id;
  
  if (!isValidJobId(jobId)) {
    logger.warn('Invalid job ID requested (JSON)', { jobId });
    return res.status(400).json({ error: 'Invalid job ID' });
  }
  
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  let duration = null;
  if (job.startedAt && job.completedAt) {
    const start = new Date(job.startedAt);
    const end = new Date(job.completedAt);
    duration = Math.round((end - start) / 1000);
  }

  res.json({
    id: job.id,
    status: job.status,
    logs: job.logs || [],
    projectType: job.projectType,
    createdAt: job.createdAt,
    duration
  });
};

module.exports = {
  createJobHandler,
  getJobHandler,
  getJobJsonHandler
};
