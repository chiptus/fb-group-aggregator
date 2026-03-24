// @ts-check
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

// /** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.tsx', '**/*.jsx'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Max 150 lines per component
      'max-lines-per-function': [
        'warn',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Max 200 lines per component file
      'max-lines': [
        'warn',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // Props destructuring in signature
      'react/destructuring-assignment': [
        'error',
        'always',
        {
          destructureInSignature: 'always',
        },
      ],

      // React 19 compat
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // Using TypeScript

      // Allow arrow functions in React components (forwardRef, etc.)
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    },
  },
];
