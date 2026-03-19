import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

type GroupBy = 'team' | 'product'

// GET /capacity?group_by=team|product
// Returns capacity matrix: [{ id, name, months: { '2025-03': { fte, headcount } } }]
router.get('/', async (req, res) => {
  const groupBy: GroupBy = req.query.group_by === 'product' ? 'product' : 'team'

  const { data: members, error } = await supabase
    .from('team_members')
    .select('fte, team:teams(id, name), product:products(id, name)')
    .eq('archived', false)

  if (error) throw error

  // Build 6-month window: current month + 5 ahead
  const months = getMonthRange(6)

  // Count distinct teams (used by frontend for per-product deduction)
  const teamIds = new Set(
    (members ?? []).map(m => (m.team as { id: string; name: string } | null)?.id).filter(Boolean)
  )

  // Group members by team or product
  const groups = new Map<string, { id: string; name: string; totalFte: number; headcount: number }>()

  for (const member of members ?? []) {
    const group = groupBy === 'team'
      ? (member.team as { id: string; name: string } | null)
      : (member.product as { id: string; name: string } | null)

    if (!group) continue

    if (!groups.has(group.id)) {
      groups.set(group.id, { id: group.id, name: group.name, totalFte: 0, headcount: 0 })
    }
    const g = groups.get(group.id)!
    g.totalFte += Number(member.fte)
    g.headcount += 1
  }

  // In MVP capacity is static (no effective dates), so every month has the same value
  const rows = Array.from(groups.values()).map(({ id, name, totalFte, headcount }) => ({
    id,
    name,
    months: Object.fromEntries(
      months.map(month => [month, { fte: round(totalFte), headcount }])
    ),
  }))

  // Sort by name
  rows.sort((a, b) => a.name.localeCompare(b.name))

  // Totals row
  const totals = Object.fromEntries(
    months.map(month => {
      const fte = round(rows.reduce((sum, r) => sum + r.months[month].fte, 0))
      const headcount = rows.reduce((sum, r) => sum + r.months[month].headcount, 0)
      return [month, { fte, headcount }]
    })
  )

  res.json({ group_by: groupBy, months, rows, totals, team_count: teamIds.size })
})

function getMonthRange(count: number): string[] {
  const months: string[] = []
  const date = new Date()
  date.setDate(1)
  for (let i = 0; i < count; i++) {
    months.push(date.toISOString().slice(0, 7)) // 'YYYY-MM'
    date.setMonth(date.getMonth() + 1)
  }
  return months
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export default router
