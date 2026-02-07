import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Catch null/undefined access
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Too noisy for pragmatic code
      // Allow runtime safety guards even if TypeScript thinks they're unnecessary
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Allow non-null assertions when we know better than TS
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Numbers in template strings are fine
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
        allowBoolean: true,
        allowNullish: false,
      }],
      // Deprecated APIs are warnings, not errors
      '@typescript-eslint/no-deprecated': 'warn',
      // Unused vars prefixed with _ are ok
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
