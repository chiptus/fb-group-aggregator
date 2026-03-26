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
  {
    // TanStack Virtual returns functions that React Compiler flags as incompatible;
    // this is a known false positive for virtualizer hooks.
    files: ['**/VirtualPostList.tsx'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    // Test files: relax function-length rules (test suites can be long)
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines-per-function': 'off', // Test suites can be long
      'max-lines': [
        'warn',
        { max: 250, skipBlankLines: true, skipComments: true },
      ], // Test suites can be longer
    },
  },
];
