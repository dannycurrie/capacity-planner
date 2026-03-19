import { useEffect, useState } from 'react'
import type { CapacityResponse } from '../types'
import { api } from '../api'
import { DrillDownModal } from './DrillDownModal'

type GroupBy = 'team' | 'product'

interface Selected {
  rowId: string
  rowName: string
  month: string
}

function formatMonth(month: string) {
  return new Date(month + '-02').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const SUPPORT_ONCALL_FTE = 1
const HOLIDAY_RATE = 0.07

function deductNonDevFte(rawFte: number): number {
  const adjusted = rawFte * (1 - HOLIDAY_RATE) - SUPPORT_ONCALL_FTE
  return Math.max(0, Math.round(adjusted * 100) / 100)
}

export function CapacityView() {
  const [groupBy, setGroupBy] = useState<GroupBy>('team')
  const [data, setData] = useState<CapacityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [deductNonDev, setDeductNonDev] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.capacity.get(groupBy)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [groupBy])

  function getDisplayFte(rawFte: number): number {
    return deductNonDev ? deductNonDevFte(rawFte) : rawFte
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Capacity</h1>
          <p className="subtitle">6-month rolling view</p>
        </div>
        <div className="capacity-controls">
          <div className="toggle-group">
            <button
              className={groupBy === 'team' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setGroupBy('team')}
            >
              By Team
            </button>
            <button
              className={groupBy === 'product' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setGroupBy('product')}
            >
              By Product
            </button>
          </div>
          <button
            className={deductNonDev ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setDeductNonDev(d => !d)}
            title="Deduct 1 FTE/team/month for support &amp; on-call, plus 7% for holidays"
          >
            Deduct non-dev time
          </button>
        </div>
      </div>
      {deductNonDev && (
        <p className="deduction-note">
          Showing development capacity after deducting 1 FTE/team/month for support &amp; on-call and 7% for holidays.
        </p>
      )}

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : !data || data.rows.length === 0 ? (
        <div className="empty-state">
          <p>No capacity data. Add team members in the Roster.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-group">{groupBy === 'team' ? 'Team' : 'Product'}</th>
                {data.months.map(m => (
                  <th key={m} className="col-month">{formatMonth(m)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.id}>
                  <td className="cell-name">{row.name}</td>
                  {data.months.map(m => {
                    const cell = row.months[m]
                    return (
                      <td key={m} className="col-month">
                        <button
                          className="capacity-cell"
                          onClick={() => setSelected({ rowId: row.id, rowName: row.name, month: m })}
                          title={`${row.name} — ${formatMonth(m)}`}
                        >
                          <span className="fte">{getDisplayFte(cell.fte).toFixed(1)}</span>
                          <span className="headcount">{cell.headcount} {cell.headcount === 1 ? 'person' : 'people'}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="row-totals">
                <td>Total</td>
                {data.months.map(m => {
                  const cell = data.totals[m]
                  const totalDisplayFte = deductNonDev
                    ? Math.round(data.rows.reduce((sum, r) => sum + deductNonDevFte(r.months[m].fte), 0) * 100) / 100
                    : cell.fte
                  return (
                    <td key={m} className="col-month">
                      <span className="fte">{totalDisplayFte.toFixed(1)}</span>
                      <span className="headcount">{cell.headcount} {cell.headcount === 1 ? 'person' : 'people'}</span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DrillDownModal
          rowId={selected.rowId}
          rowName={selected.rowName}
          month={selected.month}
          groupBy={groupBy}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
