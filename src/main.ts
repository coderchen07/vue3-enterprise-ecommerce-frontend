import { createApp } from 'vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import { pinia } from '@/app/store';
import router from '@/app/router';
import 'element-plus/dist/index.css';
import './style.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      networkMode: 'always',
      staleTime: 30_000,
    },
  },
});

const app = createApp(App);

app.use(pinia);
app.use(VueQueryPlugin, { queryClient });
app.use(router);
app.mount('#app');
