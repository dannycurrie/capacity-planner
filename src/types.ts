export interface Team {
  id: string
  name: string
  archived: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  archived: boolean
  created_at: string
}

export interface CapacityCell {
  fte: number
  headcount: number
}

export interface CapacityResponse {
  group_by: 'team' | 'product'
  months: string[]
  rows: {
    id: string
    name: string
    months: Record<string, CapacityCell>
  }[]
  totals: Record<string, CapacityCell>
}

export interface TeamMember {
  id: string
  name: string
  role: string
  fte: number
  team_id: string
  product_id: string
  archived: boolean
  created_at: string
  team: { id: string; name: string }
  product: { id: string; name: string }
}
