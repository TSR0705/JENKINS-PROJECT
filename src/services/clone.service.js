const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const logger = require('../utils/logger');

const execAsync = util.promisify(exec);

// Maximum repository size in MB (to prevent cloning huge repos)
const MAX_REPO_SIZE_MB = 100;

/**
 * Calculate directory size recursively
 */
const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    logger.warn('Error calculating directory size', { dirPath, error: error.message });
  }
  
  return totalSize;
};

const cloneRepo = async (repoUrl) => {
  if (!repoUrl.startsWith('https://github.com/')) {
    throw new Error('Only GitHub repositories are supported');
  }

  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const tempDir = os.tmpdir();
  const clonePath = path.join(tempDir, `openci-${Date.now()}-${repoName}`);

  try {
    logger.info('Starting repository clone', { repoUrl, clonePath });
    
    // Clone with depth=1 to minimize size
    await execAsync(
      `git clone --depth=1 --single-branch ${repoUrl} "${clonePath}"`,
      {
        timeout: 60000, // 60 second timeout for clone
        maxBuffer: 10 * 1024 * 1024
      }
    );

    // Check repository size
    const sizeInBytes = getDirectorySize(clonePath);
    const sizeInMB = Math.round(sizeInBytes / (1024 * 1024));
    
    logger.info('Repository cloned', { repoUrl, sizeInMB });
    
    if (sizeInMB > MAX_REPO_SIZE_MB) {
      logger.warn('Repository too large', { repoUrl, sizeInMB, maxSize: MAX_REPO_SIZE_MB });
      
      // Cleanup
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true });
      }
      
      throw new Error(`Repository is too large (${sizeInMB}MB). Maximum allowed is ${MAX_REPO_SIZE_MB}MB. Please use a smaller test repository.`);
    }

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
