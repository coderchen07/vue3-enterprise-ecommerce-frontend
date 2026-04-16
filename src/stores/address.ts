import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Address } from '@/entities/address';

interface AddressPayload {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const createAddressId = (): string =>
  `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const useAddressStore = defineStore(
  'address',
  () => {
    const addresses = ref<Address[]>([]);

    const defaultAddress = computed<Address | null>(
      () =>
        addresses.value.find((address) => address.isDefault) ??
        addresses.value[0] ??
        null,
    );

    const fetchAddresses = (): Address[] => [...addresses.value];

    const getAddressById = (id: string): Address | null =>
      addresses.value.find((address) => address.id === id) ?? null;

    const setDefaultAddress = (id: string): void => {
      addresses.value = addresses.value.map((address) => ({
        ...address,
        isDefault: address.id === id,
      }));
    };

    const addAddress = (payload: AddressPayload): Address => {
      const newAddress: Address = {
        id: createAddressId(),
        ...payload,
      };
      if (newAddress.isDefault || addresses.value.length === 0) {
        addresses.value = addresses.value.map((address) => ({
          ...address,
          isDefault: false,
        }));
        newAddress.isDefault = true;
      }
      addresses.value.unshift(newAddress);
      return newAddress;
    };

    const updateAddress = (id: string, payload: AddressPayload): void => {
      const index = addresses.value.findIndex((address) => address.id === id);
      if (index < 0) {
        return;
      }
      if (payload.isDefault) {
        addresses.value = addresses.value.map((address) => ({
          ...address,
          isDefault: false,
        }));
      }
      addresses.value[index] = {
        ...addresses.value[index],
        ...payload,
      };
      if (
        !addresses.value.some((address) => address.isDefault) &&
        addresses.value.length > 0
      ) {
        addresses.value[0].isDefault = true;
      }
    };

    const deleteAddress = (id: string): void => {
      const removed = addresses.value.find((address) => address.id === id);
      addresses.value = addresses.value.filter((address) => address.id !== id);
      if (removed?.isDefault && addresses.value.length > 0) {
        addresses.value[0].isDefault = true;
      }
    };

    return {
      addresses,
      defaultAddress,
      fetchAddresses,
      getAddressById,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    };
  },
  {
    persist: {
      key: 'address-store',
      storage: localStorage,
      pick: ['addresses'],
    },
  },
);
