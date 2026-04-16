import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore(
  'app',
  () => {
    const sidebarCollapsed = ref<boolean>(false);
    const globalLoading = ref<boolean>(false);

    const setSidebarCollapsed = (collapsed: boolean): void => {
      sidebarCollapsed.value = collapsed;
    };

    const setGlobalLoading = (loading: boolean): void => {
      globalLoading.value = loading;
    };

    return {
      sidebarCollapsed,
      globalLoading,
      setSidebarCollapsed,
      setGlobalLoading,
    };
  },
  {
    persist: {
      key: 'app-store',
      storage: localStorage,
      pick: ['sidebarCollapsed'],
    },
  },
);
