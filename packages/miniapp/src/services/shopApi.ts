import { request } from './request'

export function getShops() {
  return request<{ data: any[] }>({ url: '/api/shops' })
}

export function createShop(name: string) {
  return request<{ data: any }>({ url: '/api/shops', method: 'POST', data: { name } })
}

export function updateShop(shopId: number, name: string) {
  return request<{ data: any }>({ url: `/api/shops/${shopId}`, method: 'PUT', data: { name } })
}

export function getMembers(shopId: number) {
  return request<{ data: any[] }>({ url: `/api/shops/${shopId}/members` })
}

export function addMember(shopId: number, userId: number, role: string) {
  return request<{ data: any }>({ url: `/api/shops/${shopId}/members`, method: 'POST', data: { userId, role } })
}
