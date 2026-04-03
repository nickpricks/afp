import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    // afp = repo name for GitHub Pages base path
    base: mode === 'production' ? '/afp/' : '/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        devOptions: { enabled: false },
        manifest: {
          name: 'It Started On April Fools Day',
          short_name: 'AFP',
          description: 'Personal family tracker',
          theme_color: '#60a5fa',
          background_color: '#f0f7ff',
          display: 'standalone',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: { port: 3000 },
    preview: { port: 3000 },
  };
});
