import { request } from './request'

export function getInventory(shopId: number, params?: { keyword?: string; category?: string; alert?: boolean }) {
  return request<{ data: any[] }>({ url: `/api/shops/${shopId}/inventory`, params })
}

export function setAlertThreshold(shopId: number, productId: number, threshold: number) {
  return request<{ data: any }>({
    url: `/api/shops/${shopId}/inventory/${productId}/threshold`,
    method: 'PUT',
    data: { threshold },
  })
}
