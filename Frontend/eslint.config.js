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
      // El código usa `any` para respuestas dinámicas de la API — se acepta como advertencia
      '@typescript-eslint/no-explicit-any': 'warn',
      // Bloques catch vacíos son intencionales en algunos casos
      'no-empty': 'warn',
      // Dependencias de hooks — advertencia, no error
      'react-hooks/exhaustive-deps': 'warn',
      // setState dentro de useEffect es el patrón estándar para cargar datos
      'react-hooks/rules-of-hooks': 'error',
    },
  },
])
