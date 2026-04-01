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
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  login: (token, user) => {
    Taro.setStorageSync('token', token)
    Taro.setStorageSync('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('user')
    Taro.removeStorageSync('currentShop')
    set({ token: null, user: null })
  },

  loadFromStorage: () => {
    try {
      const token = Taro.getStorageSync('token')
      const userStr = Taro.getStorageSync('user')
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) })
      }
    } catch {
      // ignore
    }
  },
}))
