import { request } from './request'

export function inbound(shopId: number, data: { productId: number; quantity: number; remark?: string }) {
  return request<{ data: { record: any; updatedInventory: any } }>({
    url: `/api/shops/${shopId}/inbound`,
    method: 'POST',
    data,
  })
}

export function outbound(shopId: number, data: { productId: number; quantity: number; remark?: string }) {
  return request<{ data: { record: any; updatedInventory: any } }>({
    url: `/api/shops/${shopId}/outbound`,
    method: 'POST',
    data,
  })
}
