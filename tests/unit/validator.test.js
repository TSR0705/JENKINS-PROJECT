const { isValidGitHubUrl, sanitizeRepoUrl } = require('../../src/utils/validator');

describe('Validator', () => {
  describe('isValidGitHubUrl', () => {
    test('should accept valid GitHub URLs', () => {
      expect(isValidGitHubUrl('https://github.com/owner/repo')).toBe(true);
      expect(isValidGitHubUrl('https://github.com/microsoft/vscode')).toBe(true);
      expect(isValidGitHubUrl('https://github.com/lodash/lodash')).toBe(true);
    });

    test('should reject non-HTTPS URLs', () => {
      expect(isValidGitHubUrl('http://github.com/owner/repo')).toBe(false);
      expect(isValidGitHubUrl('ftp://github.com/owner/repo')).toBe(false);
    });

    test('should reject non-GitHub URLs', () => {
      expect(isValidGitHubUrl('https://gitlab.com/owner/repo')).toBe(false);
      expect(isValidGitHubUrl('https://bitbucket.org/owner/repo')).toBe(false);
    });

    test('should reject malformed URLs', () => {
      expect(isValidGitHubUrl('not-a-url')).toBe(false);
      expect(isValidGitHubUrl('')).toBe(false);
      expect(isValidGitHubUrl(null)).toBe(false);
      expect(isValidGitHubUrl(undefined)).toBe(false);
    });

    test('should reject URLs without owner/repo', () => {
      expect(isValidGitHubUrl('https://github.com/')).toBe(false);
      expect(isValidGitHubUrl('https://github.com/owner')).toBe(false);
    });
  });

  describe('sanitizeRepoUrl', () => {
    test('should sanitize valid URLs', () => {
      expect(sanitizeRepoUrl('https://github.com/owner/repo?tab=readme'))
        .toBe('https://github.com/owner/repo');
      expect(sanitizeRepoUrl('https://github.com/owner/repo#section'))
        .toBe('https://github.com/owner/repo');
    });

    test('should throw for invalid URLs', () => {
      expect(() => sanitizeRepoUrl('invalid-url')).toThrow();
      expect(() => sanitizeRepoUrl('https://gitlab.com/owner/repo')).toThrow();
    });
  });
});