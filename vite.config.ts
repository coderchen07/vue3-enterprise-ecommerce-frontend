import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import Components from 'unplugin-vue-components/vite';
import {
  ElementPlusResolver,
  VantResolver,
} from 'unplugin-vue-components/resolvers';
import { vitePluginMockApi } from './dev/vite-plugin-mock-api';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
  },
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      dts: 'src/types/components.d.ts',
      resolvers: [
        VantResolver({ importStyle: true }),
        ElementPlusResolver({ importStyle: 'css' }),
      ],
    }),
    vitePluginMockApi(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
