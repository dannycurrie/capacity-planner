import { useEffect, useState } from 'react'
import type { Team, Product, TeamMember } from '../types'
import { api } from '../api'
import { AddMemberModal } from './AddMemberModal'

export function RosterView() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filterTeam, setFilterTeam] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.teams.list(), api.products.list()])
      .then(([t, p]) => { setTeams(t); setProducts(p) })
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    setLoading(true)
    api.members.list({
      team_id: filterTeam || undefined,
      product_id: filterProduct || undefined,
    })
      .then(setMembers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [filterTeam, filterProduct])

  function handleSaved() {
    setShowModal(false)
    api.members.list({ team_id: filterTeam || undefined, product_id: filterProduct || undefined })
      .then(setMembers)
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Roster</h1>
          <p className="subtitle">{members.length} active member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add member</button>
      </div>

      <div className="filters">
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
          <option value="">All products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <p>No team members yet.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add the first member</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Team</th>
                <th>Product</th>
                <th className="col-fte">FTE</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td className="cell-name">{m.name}</td>
                  <td>{m.role}</td>
                  <td>{m.team.name}</td>
                  <td>{m.product.name}</td>
                  <td className="col-fte">{Number(m.fte).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddMemberModal
          teams={teams}
          products={products}
          onSave={handleSaved}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
