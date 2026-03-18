import type { Team, Product, TeamMember, CapacityResponse } from './types'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Request failed')
  return body as T
}

export const api = {
  teams: {
    list: () => req<Team[]>('/teams'),
    create: (name: string) => req<Team>('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  products: {
    list: () => req<Product[]>('/products'),
    create: (name: string) => req<Product>('/products', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  members: {
    list: (filters?: { team_id?: string; product_id?: string }) => {
      const params = new URLSearchParams()
      if (filters?.team_id) params.set('team_id', filters.team_id)
      if (filters?.product_id) params.set('product_id', filters.product_id)
      const qs = params.size ? `?${params}` : ''
      return req<TeamMember[]>(`/members${qs}`)
    },
    create: (data: { name: string; role: string; fte: number; team_id: string; product_id: string }) =>
      req<TeamMember>('/members', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; role: string; fte: number; team_id: string; product_id: string }>) =>
      req<TeamMember>(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/members/${id}`, { method: 'DELETE' }),
  },
  capacity: {
    get: (groupBy: 'team' | 'product') =>
      req<CapacityResponse>(`/capacity?group_by=${groupBy}`),
  },
}
