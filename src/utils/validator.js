const logger = require('./logger');

const isValidGitHubUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Must be HTTPS
    if (urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Must be GitHub
    if (urlObj.hostname !== 'github.com') {
      return false;
    }
    
    // Must have owner/repo format
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    if (pathParts.length < 2) {
      return false;
    }
    
    // Basic validation of owner and repo names
    const [owner, repo] = pathParts;
    const validName = /^[a-zA-Z0-9._-]+$/;
    
    if (!validName.test(owner) || !validName.test(repo)) {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('URL validation error', { url, error: error.message });
    return false;
  }
};

const sanitizeRepoUrl = (url) => {
  if (!isValidGitHubUrl(url)) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  try {
    const urlObj = new URL(url);
    // Remove any query parameters or fragments for security
    return `https://github.com${urlObj.pathname}`;
  } catch (error) {
    throw new Error('Failed to sanitize repository URL');
  }
};

const isValidJobId = (jobId) => {
  if (!jobId || typeof jobId !== 'string') {
    return false;
  }
  
  // Job ID should be alphanumeric only (timestamp + random string)
  const validJobId = /^[a-z0-9]+$/i;
  return validJobId.test(jobId) && jobId.length >= 10 && jobId.length <= 50;
};

const validateRepoUrl = (repoUrl) => {
  if (!repoUrl) {
    throw new Error('Repository URL is required');
  }
  
  if (typeof repoUrl !== 'string') {
    throw new Error('Repository URL must be a string');
  }
  
  if (repoUrl.length > 500) {
    throw new Error('Repository URL is too long');
  }
  
  return sanitizeRepoUrl(repoUrl);
};

module.exports = {
  isValidGitHubUrl,
  sanitizeRepoUrl,
  isValidJobId,
  validateRepoUrl
};