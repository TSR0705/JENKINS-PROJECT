const { spawn } = require('child_process');
const path = require('path');

const RUNNER_IMAGE = 'openci-runner-image';
const TIMEOUT_MS = 120000;

const getCommands = (projectType) => {
  if (projectType === 'node') {
    return [
      'npm install',
      'npm test',
      '(npm run lint || true)'
    ];
  }

  if (projectType === 'python') {
    return [
      'pip install --break-system-packages -r requirements.txt',
      'python3 -m unittest discover -s . -p "test_*.py"',
      '(flake8 || true)'
    ];
  }

  throw new Error(`Unsupported project type: ${projectType}`);
};

const runContainer = (workDir, commands) => {
  return new Promise((resolve) => {
    const logs = [];
    let finished = false;

    const commandStr = commands.join(' && ');
    const mountPath = path.resolve(workDir).replace(/\\/g, '/');

    const dockerArgs = [
      'run',
      '--rm',
      '--network=none',
      '--memory=512m',
      '--cpus=1',
      '--cap-drop=ALL',
      '--user', 'node',
      '-v', `${mountPath}:/workspace`,
      '-w', '/workspace',
      RUNNER_IMAGE,
      'sh',
      '-c',
      commandStr
    ];

    const docker = spawn('docker', dockerArgs);

    const timeout = setTimeout(() => {
      if (!finished) {
        logs.push('Execution timed out');
        docker.kill('SIGKILL');
        finished = true;
        resolve({ success: false, logs, timeout: true });
      }
    }, TIMEOUT_MS);

    docker.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => logs.push(line));
    });

    docker.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => logs.push(line));
    });

    docker.on('close', (code) => {
      if (finished) return;
      clearTimeout(timeout);
      finished = true;
      resolve({
        success: code === 0,
        logs
      });
    });

    docker.on('error', (err) => {
      if (finished) return;
      clearTimeout(timeout);
      finished = true;
      logs.push(`Docker error: ${err.message}`);
      resolve({ success: false, logs });
    });
  });
};

const executeJob = async (job) => {
  if (!job.workDir || !job.projectType) {
    throw new Error('Job missing workDir or projectType');
  }

  const commands = getCommands(job.projectType);
  return await runContainer(job.workDir, commands);
};

module.exports = { executeJob };
