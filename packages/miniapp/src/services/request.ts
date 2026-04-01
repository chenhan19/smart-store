import Taro from '@tarojs/taro'
import { useAuthStore } from '../store/authStore'

const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:3000'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  params?: Record<string, any>
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, params } = options
  const token = useAuthStore.getState().token

  // Build query string
  let fullUrl = `${BASE_URL}${url}`
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) fullUrl += `?${qs}`
  }

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    Taro.request({
      url: fullUrl,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          useAuthStore.getState().logout()
          Taro.reLaunch({ url: '/pages/auth/login/index' })
          reject(new Error('未授权，请重新登录'))
          return
        }
        if (res.statusCode >= 400) {
          const msg = res.data?.message || '请求失败'
          Taro.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
          return
        }
        resolve(res.data as T)
      },
      fail: () => {
        Taro.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(new Error('网络异常'))
      },
    })
  })
}
