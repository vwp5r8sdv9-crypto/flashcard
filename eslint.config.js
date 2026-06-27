import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', '.husky/_'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // react-hook-form's handleSubmit() returns a Promise-returning handler,
      // which is the normal, correct shape for a JSX event-handler attribute
      // (React fires it without awaiting). Only catch this for non-attribute
      // call sites, where a swallowed promise is usually a real bug.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // Architectural rule (docs/12-coding-standards.md, ADR-0004): domain code
  // stays framework-agnostic — no React, no Supabase.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'Domain code must stay framework-agnostic — see docs/adr/0004.',
            },
            {
              name: 'react-dom',
              message: 'Domain code must stay framework-agnostic — see docs/adr/0004.',
            },
            {
              name: '@supabase/supabase-js',
              message: 'Domain code must stay framework-agnostic — see docs/adr/0004.',
            },
          ],
        },
      ],
    },
  },

  // Architectural rule: supabase-js is only imported from the shared client
  // or from a feature's data-access module — never directly from UI/hooks.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/domain/**', 'src/lib/supabaseClient.ts', 'src/features/*/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                "Import the shared client from '@/lib/supabaseClient', or call it only from a feature's api/ module — see docs/04-architecture.md.",
            },
          ],
        },
      ],
    },
  },

  eslintConfigPrettier,
)
