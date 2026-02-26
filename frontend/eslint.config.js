import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // API responses from the backend are dynamically typed — allow `any`
      '@typescript-eslint/no-explicit-any': 'off',

      // Unused vars: ignore vars prefixed with _ (e.g. destructured [_key, value])
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],

      // Downgrade exhaustive-deps to warning; strict enforcement causes 
      // issues with intentional one-time effect patterns (e.g. on mount fetches)
      'react-hooks/exhaustive-deps': 'warn',

      // Allow setState calls in cleanup / conditional branches inside effects
      'react-hooks/rules-of-hooks': 'error',
    },
  },
])
