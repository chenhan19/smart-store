import { request } from './request'

export function getProducts(shopId: number, params?: { keyword?: string; category?: string }) {
  return request<{ data: any[] }>({ url: `/api/shops/${shopId}/products`, params })
}

export function getProductById(shopId: number, productId: number) {
  return request<{ data: any }>({ url: `/api/shops/${shopId}/products/${productId}` })
}

export function getProductByCode(shopId: number, code: string) {
  return request<{ data: any }>({ url: `/api/shops/${shopId}/products/by-code/${encodeURIComponent(code)}` })
}

export function createProduct(shopId: number, data: { name: string; code: string; category?: string; spec?: string; unit?: string }) {
  return request<{ data: any }>({ url: `/api/shops/${shopId}/products`, method: 'POST', data })
}

export function updateProduct(shopId: number, productId: number, data: Partial<{ name: string; category: string; spec: string; unit: string }>) {
  return request<{ data: any }>({ url: `/api/shops/${shopId}/products/${productId}`, method: 'PUT', data })
}
