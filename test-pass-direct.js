const { executeJob } = require('./src/services/runner.service');
const path = require('path');

async function testPassJob() {
  console.log('=== TESTING PASS JOB ===');
  
  const job = {
    workDir: path.resolve('../test-pass-job'),
    projectType: 'node',
    logs: []
  };
  
  try {
    console.log('Executing PASS job...');
    const result = await executeJob(job);
    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    console.log('Logs:');
    result.logs.forEach((log, i) => console.log(`${i+1}: ${log}`));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPassJob();