import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useInfiniteQuery } from '@tanstack/vue-query';
import { searchProducts } from '@/shared/api/modules/product';
import type { Product } from '@/entities/product';

const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_DELAY_MS = 500;

interface UseProductSearchResult {
  data: ComputedRef<Product[]>;
  isLoading: ComputedRef<boolean>;
  isFetchingNextPage: ComputedRef<boolean>;
  hasNextPage: ComputedRef<boolean>;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
  keyword: Ref<string>;
  search: (value?: string) => void;
}

export function useProductSearch(initialKeyword = ''): UseProductSearchResult {
  const keyword = ref<string>(initialKeyword.trim());
  const debouncedKeyword = ref<string>(initialKeyword.trim());
  let timerId: number | null = null;

  const syncDebouncedKeyword = (nextKeyword: string): void => {
    if (timerId !== null) {
      window.clearTimeout(timerId);
    }
    timerId = window.setTimeout(() => {
      debouncedKeyword.value = nextKeyword.trim();
    }, DEBOUNCE_DELAY_MS);
  };

  watch(
    keyword,
    (value) => {
      syncDebouncedKeyword(value);
    },
    { immediate: true },
  );

  const query = useInfiniteQuery({
    queryKey: computed(() => ['product-search', debouncedKeyword.value]),
    initialPageParam: 1,
    enabled: computed(() => debouncedKeyword.value.length > 0),
    queryFn: ({ pageParam }) =>
      searchProducts({
        keyword: debouncedKeyword.value,
        page: pageParam as number,
        size: DEFAULT_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.page * lastPage.size;
      return loadedCount < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const data = computed<Product[]>(
    () => query.data.value?.pages.flatMap((page) => page.list) ?? [],
  );
  const isLoading = computed<boolean>(
    () => query.isFetching.value && query.data.value === undefined,
  );
  const isFetchingNextPage = computed<boolean>(
    () => query.isFetchingNextPage.value,
  );
  const hasNextPage = computed<boolean>(() => Boolean(query.hasNextPage.value));

  const fetchNextPage = async (): Promise<void> => {
    if (!hasNextPage.value || isFetchingNextPage.value) {
      return;
    }
    await query.fetchNextPage();
  };

  const refetch = async (): Promise<void> => {
    await query.refetch();
  };

  const search = (value?: string): void => {
    if (typeof value === 'string') {
      keyword.value = value;
      return;
    }
    syncDebouncedKeyword(keyword.value);
  };

  return {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    keyword,
    search,
  };
}
