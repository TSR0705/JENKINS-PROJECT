const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const detectProjectType = (workDir) => {
  try {
    const packageJsonPath = path.join(workDir, 'package.json');
    const requirementsTxtPath = path.join(workDir, 'requirements.txt');
    const setupPyPath = path.join(workDir, 'setup.py');
    const pyprojectTomlPath = path.join(workDir, 'pyproject.toml');

    // Node.js detection (strict)
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8')
        );

        if (
          packageJson.scripts &&
          typeof packageJson.scripts.test === 'string' &&
          packageJson.scripts.test.trim() !== ''
        ) {
          logger.info('Detected Node.js project', { workDir });
          return 'node';
        }
      } catch (error) {
        logger.warn('Invalid package.json', { workDir, error: error.message });
      }
    }

    // Python detection (more flexible)
    const hasPythonDependencies = fs.existsSync(requirementsTxtPath) || 
                                   fs.existsSync(setupPyPath) || 
                                   fs.existsSync(pyprojectTomlPath);
    
    if (hasPythonDependencies) {
      try {
        const items = fs.readdirSync(workDir);

        // Check for tests directory
        const testsDirPath = path.join(workDir, 'tests');
        if (fs.existsSync(testsDirPath) && fs.statSync(testsDirPath).isDirectory()) {
          logger.info('Detected Python project (tests directory)', { workDir });
          return 'python';
        }

        // Check for test directory (singular)
        const testDirPath = path.join(workDir, 'test');
        if (fs.existsSync(testDirPath) && fs.statSync(testDirPath).isDirectory()) {
          logger.info('Detected Python project (test directory)', { workDir });
          return 'python';
        }

        // Check for test_*.py files in root
        const hasTestFiles = items.some(
          (item) => item.startsWith('test_') && item.endsWith('.py')
        );

        if (hasTestFiles) {
          logger.info('Detected Python project (test files)', { workDir });
          return 'python';
        }

        // Check for *_test.py files
        const hasTestSuffixFiles = items.some(
          (item) => item.endsWith('_test.py')
        );

        if (hasTestSuffixFiles) {
          logger.info('Detected Python project (test suffix files)', { workDir });
          return 'python';
        }
      } catch (error) {
        logger.warn('Error detecting Python project', { workDir, error: error.message });
      }
    }

    logger.info('No supported project type detected', { workDir });
    return null;
  } catch (error) {
    logger.error('Error in detectProjectType', { workDir, error: error.message });
    return null;
  }
};

module.exports = {
  detectProjectType
};
