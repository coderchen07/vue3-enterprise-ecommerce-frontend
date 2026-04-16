import { computed, ref, unref, type ComputedRef, type MaybeRef } from 'vue';
import { useInfiniteQuery } from '@tanstack/vue-query';
import { getProductList } from '@/shared/api/modules/product';
import type { ProductListQuery } from '@/shared/api/modules/product';
import type { Product } from '@/entities/product';

const DEFAULT_PAGE_SIZE = 12;

export function useProductList(
  params: MaybeRef<Omit<ProductListQuery, 'page'>> = {},
): {
  products: ComputedRef<Product[]>;
  isRefreshing: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
  isError: ComputedRef<boolean>;
  errorMessage: ComputedRef<string>;
  loadingMore: ComputedRef<boolean>;
  finished: ComputedRef<boolean>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
} {
  const queryParams = computed<Omit<ProductListQuery, 'page'>>(() => ({
    pageSize: DEFAULT_PAGE_SIZE,
    ...unref(params),
  }));

  const isPullRefreshing = ref<boolean>(false);

  const query = useInfiniteQuery<Product[], Error>({
    queryKey: computed(() => ['products', queryParams.value]),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getProductList({
        ...queryParams.value,
        page: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const pageSize = queryParams.value.pageSize ?? DEFAULT_PAGE_SIZE;
      return lastPage.length < pageSize ? undefined : allPages.length + 1;
    },
  });

  const products = computed<Product[]>(
    () => query.data.value?.pages.flat() ?? [],
  );
  const isLoading = computed<boolean>(
    () => query.isFetching.value && query.data.value === undefined,
  );
  const isError = computed<boolean>(() => query.isError.value);
  const errorMessage = computed<string>(() => query.error.value?.message ?? '');
  const loadingMore = computed<boolean>(() => query.isFetchingNextPage.value);
  const finished = computed<boolean>(() => !query.hasNextPage.value);
  const isRefreshing = computed<boolean>(() => isPullRefreshing.value);

  const refresh = async (): Promise<void> => {
    isPullRefreshing.value = true;
    try {
      await query.refetch();
    } finally {
      isPullRefreshing.value = false;
    }
  };

  const loadMore = async (): Promise<void> => {
    if (loadingMore.value || finished.value) {
      return;
    }
    await query.fetchNextPage();
  };

  return {
    products,
    isRefreshing,
    isLoading,
    isError,
    errorMessage,
    loadingMore,
    finished,
    refresh,
    loadMore,
  };
}
