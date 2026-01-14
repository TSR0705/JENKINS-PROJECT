const { createJob, getJob } = require('../../src/jobs/jobStore');

describe('JobStore', () => {
  describe('createJob', () => {
    test('should create a job with correct structure', () => {
      const repoUrl = 'https://github.com/owner/repo';
      const job = createJob(repoUrl);

      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('repoUrl', repoUrl);
      expect(job).toHaveProperty('status', 'PENDING');
      expect(job).toHaveProperty('createdAt');
      expect(job).toHaveProperty('startedAt', null);
      expect(job).toHaveProperty('completedAt', null);
      expect(job).toHaveProperty('logs');
      expect(job).toHaveProperty('projectType', null);
      expect(job).toHaveProperty('workDir', null);
    });

    test('should create unique job IDs', () => {
      const job1 = createJob('https://github.com/owner/repo1');
      const job2 = createJob('https://github.com/owner/repo2');

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getJob', () => {
    test('should retrieve created job', () => {
      const repoUrl = 'https://github.com/owner/repo';
      const job = createJob(repoUrl);
      const retrieved = getJob(job.id);

      expect(retrieved).toBe(job);
    });

    test('should return undefined for non-existent job', () => {
      const retrieved = getJob('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });
});