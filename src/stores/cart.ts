import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { CartItem } from '@/entities/cart';

type CartStoreItem = CartItem & {
  selected: boolean;
};

const CART_ITEMS_KEY = 'cartItems';

const clampQuantity = (quantity: number, stock: number): number => {
  const safeStock = Math.max(1, stock);
  const normalizedQuantity = Math.max(1, quantity);
  return Math.min(normalizedQuantity, safeStock);
};

const syncCartToStorage = (items: CartStoreItem[]): void => {
  localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
};

const clearCartFromStorage = (): void => {
  localStorage.removeItem(CART_ITEMS_KEY);
};

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartStoreItem[]>([]);

    const totalCount = computed<number>(() =>
      items.value.reduce((sum, item) => sum + item.quantity, 0),
    );

    const totalPrice = computed<number>(() =>
      items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const selectedItems = computed<CartStoreItem[]>(() =>
      items.value.filter((item) => item.selected),
    );

    const selectedTotalPrice = computed<number>(() =>
      selectedItems.value.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    );

    const addItem = (item: CartItem): void => {
      const targetIndex = items.value.findIndex(
        (cartItem) =>
          cartItem.skuId === item.skuId &&
          Boolean(cartItem.isSeckill) === Boolean(item.isSeckill) &&
          (cartItem.seckillPrice ?? cartItem.price) ===
            (item.seckillPrice ?? item.price),
      );

      if (targetIndex >= 0) {
        const targetItem = items.value[targetIndex];
        const nextQuantity = clampQuantity(
          targetItem.quantity + item.quantity,
          targetItem.stock,
        );
        items.value[targetIndex] = {
          ...targetItem,
          quantity: nextQuantity,
        };
      } else {
        items.value.push({
          ...item,
          quantity: clampQuantity(item.quantity, item.stock),
          selected: true,
        });
      }

      syncCartToStorage(items.value);
    };

    const removeItem = (id: string): void => {
      items.value = items.value.filter((item) => item.id !== id);
      if (items.value.length === 0) {
        clearCartFromStorage();
        return;
      }
      syncCartToStorage(items.value);
    };

    const updateQuantity = (id: string, quantity: number): void => {
      const targetIndex = items.value.findIndex((item) => item.id === id);
      if (targetIndex < 0) {
        return;
      }

      const targetItem = items.value[targetIndex];
      items.value[targetIndex] = {
        ...targetItem,
        quantity: clampQuantity(quantity, targetItem.stock),
      };
      syncCartToStorage(items.value);
    };

    const toggleSelection = (id: string): void => {
      const targetIndex = items.value.findIndex((item) => item.id === id);
      if (targetIndex < 0) {
        return;
      }

      const targetItem = items.value[targetIndex];
      items.value[targetIndex] = {
        ...targetItem,
        selected: !targetItem.selected,
      };
      syncCartToStorage(items.value);
    };

    const clearCart = (): void => {
      items.value = [];
      clearCartFromStorage();
    };

    return {
      items,
      totalCount,
      totalPrice,
      selectedItems,
      selectedTotalPrice,
      addItem,
      removeItem,
      updateQuantity,
      toggleSelection,
      clearCart,
    };
  },
  {
    persist: {
      key: 'cart-store',
      storage: localStorage,
      pick: ['items'],
    },
  },
);
