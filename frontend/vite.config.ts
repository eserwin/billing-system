import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    warmup: {
      clientFiles: [
        './src/views/**/*.vue',
        './src/components/**/*.vue',
        './src/stores/*.ts',
        './src/services/*.ts',
        './src/composables/*.ts',
      ],
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'vuetify',
      'chart.js',
      'vue-chartjs',
      'date-fns',
    ],
  },
});
