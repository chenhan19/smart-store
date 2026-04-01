import { request } from './request'

export function login(code: string) {
  return request<{ code: string; data: { token: string; user: { id: number; role: 'owner' | 'operator'; nickname: string } } }>({
    url: '/api/auth/login',
    method: 'POST',
    data: { code },
  })
}
