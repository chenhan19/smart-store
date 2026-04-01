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
  // 只持久化 shopId，不存完整对象
  saveLastShopId: (shopId: number) => void
  getLastShopId: () => number | null
  clearShop: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  currentShop: null,
  shops: [],

  setCurrentShop: (shop) => {
    // 只存 id，不存完整 shop 对象
    Taro.setStorageSync('lastShopId', String(shop.id))
    set({ currentShop: shop })
  },

  setShops: (shops) => {
    set({ shops })
  },

  saveLastShopId: (shopId) => {
    Taro.setStorageSync('lastShopId', String(shopId))
  },

  getLastShopId: () => {
    try {
      const id = Taro.getStorageSync('lastShopId')
      return id ? parseInt(id) : null
    } catch {
      return null
    }
  },

  clearShop: () => {
    Taro.removeStorageSync('lastShopId')
    set({ currentShop: null, shops: [] })
  },
}))
