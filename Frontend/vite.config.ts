import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      allowedHosts: [
        env.VITE_FRONT_END_URL,
      ],
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      fs: {
        deny: [
          'docker-compose.*',
          'Dockerfile',
          'Dockerfile.*',
          '.env',
          '.env.*',
          '.git/',
          '.gitignore',
          'package-lock.json',
        ],
      }
    }
  };
});