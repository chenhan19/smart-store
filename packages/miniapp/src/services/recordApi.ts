import { request } from './request'

export function getRecords(
  shopId: number,
  params?: { type?: 'in' | 'out'; startDate?: string; endDate?: string; keyword?: string; page?: number; pageSize?: number }
) {
  return request<{ data: { total: number; page: number; pageSize: number; list: any[] } }>({
    url: `/api/shops/${shopId}/records`,
    params,
  })
}
