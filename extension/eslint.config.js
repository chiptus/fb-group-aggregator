// @ts-check
import baseConfig from '../eslint.config.js';
import reactConfig from '../eslint.config.react.js';

export default [
  ...baseConfig,
  ...reactConfig,
  {
    // Extension-specific overrides
    rules: {
      // Allow console in extension code
      'no-console': 'off',
    },
  },
];
