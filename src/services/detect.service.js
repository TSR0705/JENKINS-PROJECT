const fs = require('fs');
const path = require('path');

const detectProjectType = (workDir) => {
  const packageJsonPath = path.join(workDir, 'package.json');
  const requirementsTxtPath = path.join(workDir, 'requirements.txt');

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
        return 'node';
      }
    } catch (_) {
      // Invalid package.json → not a valid Node project
    }
  }

  // Python detection (strict)
  if (fs.existsSync(requirementsTxtPath)) {
    try {
      const items = fs.readdirSync(workDir);

      const testsDirPath = path.join(workDir, 'tests');
      if (
        fs.existsSync(testsDirPath) &&
        fs.statSync(testsDirPath).isDirectory()
      ) {
        return 'python';
      }

      const hasTestFiles = items.some(
        (item) => item.startsWith('test_') && item.endsWith('.py')
      );

      if (hasTestFiles) {
        return 'python';
      }
    } catch (_) {
      // Any filesystem issue → treat as unsupported
    }
  }

  return null;
};

module.exports = {
  detectProjectType
};
