import { create } from 'zustand'
import Taro from '@tarojs/taro'

export interface Shop {
  id: number
  name: string
  createdAt: string
}

interface ShopState {
  currentShop: Shop | null
  shops: Shop[]
  setCurrentShop: (shop: Shop) => void
  setShops: (shops: Shop[]) => void
  loadFromStorage: () => void
  clearShop: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  currentShop: null,
  shops: [],

  setCurrentShop: (shop) => {
    Taro.setStorageSync('currentShop', JSON.stringify(shop))
    set({ currentShop: shop })
  },

  setShops: (shops) => {
    set({ shops })
  },

  loadFromStorage: () => {
    try {
      const shopStr = Taro.getStorageSync('currentShop')
      if (shopStr) {
        set({ currentShop: JSON.parse(shopStr) })
      }
    } catch {
      // ignore
    }
  },

  clearShop: () => {
    Taro.removeStorageSync('currentShop')
    set({ currentShop: null, shops: [] })
  },
}))
