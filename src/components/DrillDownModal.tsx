import { useEffect, useState } from 'react'
import type { TeamMember } from '../types'
import { api } from '../api'

interface Props {
  rowId: string
  rowName: string
  month: string
  groupBy: 'team' | 'product'
  onClose: () => void
}

function formatMonth(month: string) {
  return new Date(month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function DrillDownModal({ rowId, rowName, month, groupBy, onClose }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const filter = groupBy === 'team' ? { team_id: rowId } : { product_id: rowId }
    api.members.list(filter)
      .then(setMembers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [rowId, groupBy])

  const totalFte = members.reduce((sum, m) => sum + Number(m.fte), 0)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="drill-title">
        <div className="modal-header">
          <div>
            <h2 id="drill-title">{rowName}</h2>
            <p className="subtitle">{formatMonth(month)}</p>
          </div>
          <button className="btn-ghost icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {loading && <p className="loading">Loading…</p>}
          {error && <p className="form-error">{error}</p>}
          {!loading && !error && (
            members.length === 0 ? (
              <p className="loading">No members assigned.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th className="col-fte">FTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td className="cell-name">{m.name}</td>
                        <td>{m.role}</td>
                        <td className="col-fte">{Number(m.fte).toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr className="row-totals">
                      <td colSpan={2}>Total</td>
                      <td className="col-fte">{totalFte.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
