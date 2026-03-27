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

export type InitiativeStatus = 'proposed' | 'discovery' | 'selected' | 'in_development' | 'released' | 'backburner' | 'rejected'
export type InitiativeSource = 'product' | 'tech'

export interface Initiative {
  id: string
  product_id: string
  name: string
  description: string | null
  effort_months: number | null
  status: InitiativeStatus
  prd_link: string | null
  source: InitiativeSource
  selected_for_development: boolean
  start_month: string | null
  created_at: string
  product: { id: string; name: string }
}

export interface LoadCell {
  load_fte: number
  capacity_fte: number
  ratio: number
}

export interface LoadResponse {
  group_by: 'team' | 'product'
  months: string[]
  rows: {
    id: string
    name: string
    months: Record<string, LoadCell>
    unscheduled_load: number
  }[]
  totals: Record<string, LoadCell>
  unscheduled_total: number
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
