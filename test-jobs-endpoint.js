const express = require('express');
const { createJob } = require('./src/jobs/jobStore');

const app = express();

// Test endpoint to create sample jobs
app.get('/create-test-jobs', (req, res) => {
  // PASS Job
  const passJob = createJob('https://github.com/test/pass-repo');
  passJob.projectType = 'node';
  passJob.status = 'PASS';
  passJob.startedAt = new Date(Date.now() - 10000).toISOString();
  passJob.completedAt = new Date().toISOString();
  passJob.logs = [
    'npm install started',
    'up to date, audited 15 packages in 2s',
    'found 0 vulnerabilities',
    '> test-app@1.0.0 test',
    '> jest',
    'PASS ./test/app.test.js',
    '  ✓ should add numbers correctly (2 ms)',
    '  ✓ should handle edge cases (1 ms)',
    'Test Suites: 1 passed, 1 total',
    'Tests: 2 passed, 2 total',
    'Snapshots: 0 total',
    'Time: 0.5 s',
    'Ran all test suites.',
    'All tests passed successfully!'
  ];
  
  // FAIL Job
  const failJob = createJob('https://github.com/test/fail-repo');
  failJob.projectType = 'node';
  failJob.status = 'FAIL';
  failJob.startedAt = new Date(Date.now() - 8000).toISOString();
  failJob.completedAt = new Date().toISOString();
  failJob.logs = [
    'npm install started',
    'up to date, audited 12 packages in 1s',
    'found 0 vulnerabilities',
    '> test-app@1.0.0 test',
    '> jest',
    'FAIL ./test/app.test.js',
    '  ✗ should add numbers correctly (5 ms)',
    '    Expected: 4',
    '    Received: 5',
    '  ✓ should handle edge cases (1 ms)',
    'Test Suites: 1 failed, 1 total',
    'Tests: 1 failed, 1 passed, 2 total',
    'Snapshots: 0 total',
    'Time: 0.8 s',
    'npm test exited with code 1'
  ];
  
  // TIMEOUT Job
  const timeoutJob = createJob('https://github.com/test/timeout-repo');
  timeoutJob.projectType = 'python';
  timeoutJob.status = 'TIMEOUT';
  timeoutJob.startedAt = new Date(Date.now() - 120000).toISOString();
  timeoutJob.completedAt = new Date().toISOString();
  timeoutJob.logs = [
    'pip install started',
    'Collecting requests',
    'Downloading requests-2.28.1-py3-none-any.whl (62 kB)',
    'Collecting urllib3>=1.21.1',
    'Downloading urllib3-1.26.12-py2.py3-none-any.whl (140 kB)',
    'Installing collected packages: urllib3, requests',
    'Successfully installed requests-2.28.1 urllib3-1.26.12',
    'pytest started',
    'collecting tests...',
    'collected 25 items',
    'test_api.py::test_connection PASSED',
    'test_api.py::test_authentication PASSED',
    'test_api.py::test_large_dataset'
  ];
  
  res.json({
    message: 'Test jobs created successfully',
    jobs: {
      pass: { id: passJob.id, url: `/job/${passJob.id}` },
      fail: { id: failJob.id, url: `/job/${failJob.id}` },
      timeout: { id: timeoutJob.id, url: `/job/${timeoutJob.id}` }
    }
  });
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});