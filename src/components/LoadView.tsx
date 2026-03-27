import { useEffect, useState } from 'react'
import type { LoadResponse, LoadCell } from '../types'
import { api } from '../api'

type GroupBy = 'team' | 'product'
type ViewMode = 'monthly' | 'quarterly'

const SUPPORT_ONCALL_RATE = 0.20
const HOLIDAY_RATE = 0.07
const NON_DEV_RATE = SUPPORT_ONCALL_RATE + HOLIDAY_RATE

const WARN_THRESHOLD = 0.85 // amber: approaching capacity

function deductNonDev(fte: number) {
  return Math.max(0, Math.round(fte * (1 - NON_DEV_RATE) * 100) / 100)
}

function cellStatus(ratio: number): 'over' | 'warn' | 'ok' {
  if (ratio > 1.0) return 'over'
  if (ratio >= WARN_THRESHOLD) return 'warn'
  return 'ok'
}

function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

function quarterLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number)
  const q = Math.ceil(month / 3)
  return `Q${q} ${year}`
}

// Group an array of month strings into quarters, returning [quarterLabel, months[]]
function groupIntoQuarters(months: string[]): [string, string[]][] {
  const map = new Map<string, string[]>()
  for (const m of months) {
    const label = quarterLabel(m)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(m)
  }
  return Array.from(map.entries())
}

interface QuarterCell {
  load_fte: number
  capacity_fte: number
  ratio: number
}

function aggregateQuarter(monthCells: LoadCell[]): QuarterCell {
  const load_fte = Math.round(monthCells.reduce((s, c) => s + c.load_fte, 0) * 100) / 100
  const capacity_fte = Math.round(monthCells.reduce((s, c) => s + c.capacity_fte, 0) * 100) / 100
  const ratio = capacity_fte > 0 ? Math.round((load_fte / capacity_fte) * 100) / 100 : 0
  return { load_fte, capacity_fte, ratio }
}

export function LoadView() {
  const [groupBy, setGroupBy] = useState<GroupBy>('team')
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [deductNonDevTime, setDeductNonDevTime] = useState(false)
  const [data, setData] = useState<LoadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    // Fetch 12 months so quarterly view always has 4 complete quarters
    api.load.get(groupBy, 12)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [groupBy])

  if (loading) return <div className="view"><p className="loading">Loading…</p></div>
  if (error) return <div className="view"><p className="page-error">{error}</p></div>
  if (!data) return null

  // Apply the non-dev deduction to capacity if toggled (load stays raw)
  function effectiveCapacity(rawCapFte: number) {
    return deductNonDevTime ? deductNonDev(rawCapFte) : rawCapFte
  }

  function adjustedCell(cell: LoadCell): LoadCell {
    const capacity_fte = effectiveCapacity(cell.capacity_fte)
    const ratio = capacity_fte > 0 ? Math.round((cell.load_fte / capacity_fte) * 100) / 100 : 0
    return { load_fte: cell.load_fte, capacity_fte, ratio }
  }

  const months = viewMode === 'monthly' ? data.months.slice(0, 6) : data.months
  const quarters = groupIntoQuarters(months)

  // Find over-subscribed labels for the callout banner
  const overItems: string[] = []

  if (viewMode === 'monthly') {
    for (const row of data.rows) {
      for (const month of months) {
        const cell = adjustedCell(row.months[month])
        if (cell.ratio > 1.0) {
          overItems.push(`${row.name} (${formatMonth(month)})`)
        }
      }
    }
    // Also check totals
    for (const month of months) {
      const cell = adjustedCell(data.totals[month])
      if (cell.ratio > 1.0 && !overItems.some(x => x.startsWith('Total'))) {
        // Only add total if not all individual rows already listed
      }
    }
  } else {
    for (const row of data.rows) {
      for (const [qLabel, qMonths] of quarters) {
        const cells = qMonths.map(m => adjustedCell(row.months[m]))
        const agg = aggregateQuarter(cells)
        if (agg.ratio > 1.0) overItems.push(`${row.name} (${qLabel})`)
      }
    }
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Load vs Capacity</h1>
          <p className="subtitle">Selected initiative demand vs available FTE</p>
        </div>
        <div className="capacity-controls">
          <div className="toggle-group">
            <button
              className={`btn-ghost${groupBy === 'team' ? ' active' : ''}`}
              onClick={() => setGroupBy('team')}
            >By Team</button>
            <button
              className={`btn-ghost${groupBy === 'product' ? ' active' : ''}`}
              onClick={() => setGroupBy('product')}
            >By Product</button>
          </div>
          <div className="toggle-group">
            <button
              className={`btn-ghost${viewMode === 'monthly' ? ' active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >Monthly</button>
            <button
              className={`btn-ghost${viewMode === 'quarterly' ? ' active' : ''}`}
              onClick={() => setViewMode('quarterly')}
            >Quarterly</button>
          </div>
          <button
            className={`btn-ghost${deductNonDevTime ? ' active' : ''}`}
            onClick={() => setDeductNonDevTime(v => !v)}
            title="Deduct 20% support/on-call and 7% holidays from capacity"
          >
            Deduct non-dev time
          </button>
        </div>
      </div>

      {deductNonDevTime && (
        <p className="deduction-note">
          Capacity reduced by 27% (20% support/on-call + 7% holidays). Load is shown as-is.
        </p>
      )}

      {overItems.length > 0 && (
        <div className="oversubscribed-banner">
          Over-subscribed: {overItems.join(', ')}
        </div>
      )}

      {data.rows.length === 0 ? (
        <div className="empty-state">
          <p>No team members found. Add members in the Roster tab to see capacity.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-group">{groupBy === 'team' ? 'Team' : 'Product'}</th>
                {viewMode === 'monthly'
                  ? months.map(m => <th key={m} className="col-month">{formatMonth(m)}</th>)
                  : quarters.map(([label]) => <th key={label} className="col-month">{label}</th>)
                }
                <th className="col-unscheduled">Unscheduled</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.id}>
                  <td className="cell-name">{row.name}</td>
                  {viewMode === 'monthly'
                    ? months.map(month => {
                        const cell = adjustedCell(row.months[month])
                        const status = cellStatus(cell.ratio)
                        return (
                          <td key={month} className="col-month">
                            <div className={`load-cell`} data-status={status}>
                              <span className="load-num">{cell.load_fte}</span>
                              <span className="cap-num">/ {cell.capacity_fte}</span>
                            </div>
                          </td>
                        )
                      })
                    : quarters.map(([qLabel, qMonths]) => {
                        const cells = qMonths.map(m => adjustedCell(row.months[m]))
                        const agg = aggregateQuarter(cells)
                        const status = cellStatus(agg.ratio)
                        return (
                          <td key={qLabel} className="col-month">
                            <div className="load-cell" data-status={status}>
                              <span className="load-num">{agg.load_fte}</span>
                              <span className="cap-num">/ {agg.capacity_fte}</span>
                            </div>
                          </td>
                        )
                      })
                  }
                  <td className="col-unscheduled">
                    {row.unscheduled_load > 0
                      ? <span className="unscheduled-val">{row.unscheduled_load} mo</span>
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="row-totals">
                <td>Total</td>
                {viewMode === 'monthly'
                  ? months.map(month => {
                      const cell = adjustedCell(data.totals[month])
                      const status = cellStatus(cell.ratio)
                      return (
                        <td key={month} className="col-month">
                          <div className="load-cell" data-status={status}>
                            <span className="load-num">{cell.load_fte}</span>
                            <span className="cap-num">/ {cell.capacity_fte}</span>
                          </div>
                        </td>
                      )
                    })
                  : quarters.map(([qLabel, qMonths]) => {
                      const cells = qMonths.map(m => adjustedCell(data.totals[m]))
                      const agg = aggregateQuarter(cells)
                      const status = cellStatus(agg.ratio)
                      return (
                        <td key={qLabel} className="col-month">
                          <div className="load-cell" data-status={status}>
                            <span className="load-num">{agg.load_fte}</span>
                            <span className="cap-num">/ {agg.capacity_fte}</span>
                          </div>
                        </td>
                      )
                    })
                }
                <td className="col-unscheduled">
                  {data.unscheduled_total > 0
                    ? <span className="unscheduled-val">{data.unscheduled_total} mo</span>
                    : <span className="muted">—</span>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {data.unscheduled_total > 0 && (
        <p className="unscheduled-note">
          {data.unscheduled_total} person-month{data.unscheduled_total !== 1 ? 's' : ''} of unscheduled load — initiatives marked for development but without a start month set.
        </p>
      )}
    </div>
  )
}
