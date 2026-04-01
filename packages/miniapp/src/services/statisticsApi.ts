import { request } from './request'

export function getSummary(shopId: number) {
  return request<{ data: { todayInbound: number; todayOutbound: number; productCount: number; alertCount: number } }>({
    url: `/api/shops/${shopId}/statistics/summary`,
  })
}

export function getTrend(shopId: number, startDate: string, endDate: string) {
  return request<{ data: { dates: string[]; inbound: number[]; outbound: number[] } }>({
    url: `/api/shops/${shopId}/statistics/trend`,
    params: { startDate, endDate },
  })
}

export function getCategoryDistribution(shopId: number) {
  return request<{ data: Array<{ category: string; count: number; percentage: number }> }>({
    url: `/api/shops/${shopId}/statistics/category-distribution`,
  })
}

export function getTopInventory(shopId: number) {
  return request<{ data: Array<{ productId: number; name: string; quantity: number }> }>({
    url: `/api/shops/${shopId}/statistics/top-inventory`,
  })
}
