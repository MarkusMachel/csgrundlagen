module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'storybook-static', '.eslintrc.cjs', 'public'],
  parser: '@typescript-eslint/parser',
  plugins: ['import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    // Enforce the feature-boundary rule from the spec (§4.1): other features may only
    // import a feature's public API (its index.ts barrel), never internal files.
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/features/*/components/*', '@/features/*/hooks/*', '@/features/*/utils/*'],
            message:
              'Deep imports into a feature are forbidden — import from the feature barrel (@/features/<name>) instead.',
          },
        ],
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
  },
  overrides: [
    {
      // Files inside a feature may import their own internals freely.
      files: ['src/features/**/*'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};
