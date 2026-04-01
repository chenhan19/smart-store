import { create } from 'zustand'
import Taro from '@tarojs/taro'

export interface AuthUser {
  id: number
  role: 'owner' | 'operator'
  nickname?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  loadTokenFromStorage: () => string | null
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  login: (token, user) => {
    // 只持久化 token，user 信息仅存内存
    Taro.setStorageSync('token', token)
    set({ token, user })
  },

  logout: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('lastShopId')
    set({ token: null, user: null })
  },

  loadTokenFromStorage: () => {
    try {
      const token = Taro.getStorageSync('token')
      if (token) {
        set({ token })
        return token
      }
    } catch {
      // ignore
    }
    return null
  },
}))
