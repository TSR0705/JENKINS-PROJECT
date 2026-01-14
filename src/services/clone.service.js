const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const logger = require('../utils/logger');

const execAsync = util.promisify(exec);

const cloneRepo = async (repoUrl) => {
  if (!repoUrl.startsWith('https://github.com/')) {
    throw new Error('Only GitHub repositories are supported');
  }

  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const tempDir = os.tmpdir();
  const clonePath = path.join(tempDir, `openci-${Date.now()}-${repoName}`);

  try {
    await execAsync(
      `git clone --depth=1 ${repoUrl} "${clonePath}"`,
      {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024
      }
    );

    return clonePath;
  } catch (error) {
    logger.error('Clone failed', { repoUrl, error: error.message });
    try {
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      logger.error('Cleanup failed', { clonePath, error: cleanupError.message });
    }

    throw error;
  }
};

module.exports = {
  cloneRepo
};
