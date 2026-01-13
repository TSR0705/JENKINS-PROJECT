const { createJob, getJob } = require('../jobs/jobStore');

const createJobHandler = (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).send('Repository URL is required');
  }
  
  const job = createJob(repoUrl);
  res.redirect(`/job/${job.id}`);
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