import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

type GroupBy = 'team' | 'product'

interface LoadCell {
  load_fte: number
  capacity_fte: number
  ratio: number
}

// GET /load?group_by=team|product&months=6
// Returns load (initiative demand) vs capacity matrix for the given window.
// Only initiatives with selected_for_development=true are included.
// Initiatives with a start_month are spread evenly across effort_months months.
// Initiatives without a start_month are counted in unscheduled_load only.
router.get('/', async (req, res) => {
  const groupBy: GroupBy = req.query.group_by === 'product' ? 'product' : 'team'
  const monthCount = Math.min(Math.max(parseInt(req.query.months as string) || 6, 1), 24)
  const months = getMonthRange(monthCount)
  const monthSet = new Set(months)

  // --- Capacity: fetch all non-archived members ---
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('fte, team_id, product_id, team:teams(id, name), product:products(id, name)')
    .eq('archived', false)

  if (membersError) throw membersError

  // Build capacity map keyed by group id, and per-product FTE breakdown for load attribution
  const capacityMap = new Map<string, { id: string; name: string; fte: number }>()
  // productTeamFte[productId][teamId] = total FTE of members on that product+team combo
  const productTeamFte = new Map<string, Map<string, number>>()
  // productTotalFte[productId] = total FTE across all teams for that product
  const productTotalFte = new Map<string, number>()
  // productCapacityMap[productId] = { id, name, fte }
  const productCapacityMap = new Map<string, { id: string; name: string; fte: number }>()

  for (const m of members ?? []) {
    const team = m.team as { id: string; name: string } | null
    const product = m.product as { id: string; name: string } | null
    if (!team || !product) continue
    const fte = Number(m.fte)

    // Capacity by team
    if (!capacityMap.has(team.id)) {
      capacityMap.set(team.id, { id: team.id, name: team.name, fte: 0 })
    }
    capacityMap.get(team.id)!.fte += fte

    // Capacity by product
    if (!productCapacityMap.has(product.id)) {
      productCapacityMap.set(product.id, { id: product.id, name: product.name, fte: 0 })
    }
    productCapacityMap.get(product.id)!.fte += fte

    // Product → team FTE breakdown (for proportional attribution)
    if (!productTeamFte.has(product.id)) productTeamFte.set(product.id, new Map())
    const teamMap = productTeamFte.get(product.id)!
    teamMap.set(team.id, (teamMap.get(team.id) ?? 0) + fte)
    productTotalFte.set(product.id, (productTotalFte.get(product.id) ?? 0) + fte)
  }

  // --- Load: fetch selected initiatives ---
  const { data: initiatives, error: initError } = await supabase
    .from('initiatives')
    .select('id, product_id, effort_months, start_month')
    .eq('selected_for_development', true)

  if (initError) throw initError

  // load[groupId][month] = accumulated FTE-months of load
  const loadMap = new Map<string, Map<string, number>>()
  // unscheduled load per group
  const unscheduledMap = new Map<string, number>()

  const groupMap = groupBy === 'team' ? capacityMap : productCapacityMap

  // Initialise every known group with zero load
  for (const id of groupMap.keys()) {
    loadMap.set(id, new Map(months.map(m => [m, 0])))
    unscheduledMap.set(id, 0)
  }

  for (const initiative of initiatives ?? []) {
    const effortMonths = initiative.effort_months != null ? Number(initiative.effort_months) : null
    const startMonth: string | null = initiative.start_month

    // Skip initiatives with no effort estimate
    if (effortMonths == null || effortMonths <= 0) continue

    const productId: string = initiative.product_id
    const duration = Math.ceil(effortMonths) // number of calendar months this spans
    const monthlyLoad = effortMonths / duration // FTE-months per month (= 1.0 when effort_months is whole)

    if (startMonth == null) {
      // Unscheduled: attribute proportionally to groups
      attributeToGroups(groupBy, productId, effortMonths, productTeamFte, productTotalFte, groupMap, (groupId, load) => {
        unscheduledMap.set(groupId, (unscheduledMap.get(groupId) ?? 0) + load)
      })
      continue
    }

    // Build the list of calendar months this initiative covers
    const coveredMonths = getMonthsFrom(startMonth, duration).filter(m => monthSet.has(m))
    if (coveredMonths.length === 0) continue

    // Distribute monthly load proportionally across groups
    for (const month of coveredMonths) {
      attributeToGroups(groupBy, productId, monthlyLoad, productTeamFte, productTotalFte, groupMap, (groupId, load) => {
        const gMap = loadMap.get(groupId)
        if (gMap) gMap.set(month, (gMap.get(month) ?? 0) + load)
      })
    }
  }

  // --- Build response ---
  const rows = Array.from(groupMap.values()).map(({ id, name, fte: capFte }) => {
    const monthLoadMap = loadMap.get(id) ?? new Map()
    return {
      id,
      name,
      months: Object.fromEntries(
        months.map(month => {
          const loadFte = round(monthLoadMap.get(month) ?? 0)
          const capacityFte = round(capFte)
          return [month, { load_fte: loadFte, capacity_fte: capacityFte, ratio: capacityFte > 0 ? round(loadFte / capacityFte) : 0 }]
        })
      ) as Record<string, LoadCell>,
      unscheduled_load: round(unscheduledMap.get(id) ?? 0),
    }
  })

  rows.sort((a, b) => a.name.localeCompare(b.name))

  const totals: Record<string, LoadCell> = Object.fromEntries(
    months.map(month => {
      const loadFte = round(rows.reduce((s, r) => s + r.months[month].load_fte, 0))
      const capacityFte = round(rows.reduce((s, r) => s + r.months[month].capacity_fte, 0))
      return [month, { load_fte: loadFte, capacity_fte: capacityFte, ratio: capacityFte > 0 ? round(loadFte / capacityFte) : 0 }]
    })
  )

  const unscheduled_total = round(rows.reduce((s, r) => s + r.unscheduled_load, 0))

  res.json({ group_by: groupBy, months, rows, totals, unscheduled_total })
})

// Attribute a load amount to groups proportionally based on product membership.
// For group_by=product, the full load goes directly to the initiative's product group.
// For group_by=team, the load is split across teams proportional to their FTE share on that product.
function attributeToGroups(
  groupBy: GroupBy,
  productId: string,
  load: number,
  productTeamFte: Map<string, Map<string, number>>,
  productTotalFte: Map<string, number>,
  groupMap: Map<string, unknown>,
  apply: (groupId: string, load: number) => void,
) {
  if (groupBy === 'product') {
    if (groupMap.has(productId)) apply(productId, load)
    return
  }

  // Distribute across teams proportionally
  const teamFteMap = productTeamFte.get(productId)
  const totalFte = productTotalFte.get(productId) ?? 0
  if (!teamFteMap || totalFte === 0) return

  for (const [teamId, teamFte] of teamFteMap.entries()) {
    const share = teamFte / totalFte
    apply(teamId, load * share)
  }
}

function getMonthRange(count: number): string[] {
  const months: string[] = []
  const date = new Date()
  date.setDate(1)
  for (let i = 0; i < count; i++) {
    months.push(date.toISOString().slice(0, 7))
    date.setMonth(date.getMonth() + 1)
  }
  return months
}

function getMonthsFrom(startMonth: string, count: number): string[] {
  const [year, month] = startMonth.split('-').map(Number)
  const months: string[] = []
  const date = new Date(year, month - 1, 1)
  for (let i = 0; i < count; i++) {
    months.push(date.toISOString().slice(0, 7))
    date.setMonth(date.getMonth() + 1)
  }
  return months
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export default router
