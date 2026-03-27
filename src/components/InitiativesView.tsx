import { useEffect, useState } from 'react'
import type { Product, Initiative, InitiativeStatus } from '../types'
import { api } from '../api'
import { AddInitiativeModal } from './AddInitiativeModal'

const STATUS_LABELS: Record<InitiativeStatus, string> = {
  proposed: 'Proposed',
  discovery: 'Discovery',
  selected: 'Selected',
  in_development: 'In Development',
  released: 'Released',
  backburner: 'Backburner',
  rejected: 'Rejected',
}

const STATUS_COLORS: Record<InitiativeStatus, string> = {
  proposed: '#6366f1',
  discovery: '#f59e0b',
  selected: '#3b82f6',
  in_development: '#8b5cf6',
  released: '#10b981',
  backburner: '#6b7280',
  rejected: '#ef4444',
}

export function InitiativesView() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filterProduct, setFilterProduct] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Initiative | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.products.list()
      .then(setProducts)
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    setLoading(true)
    api.initiatives.list({ product_id: filterProduct || undefined })
      .then(setInitiatives)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [filterProduct])

  function handleSaved() {
    setShowModal(false)
    setEditing(null)
    api.initiatives.list({ product_id: filterProduct || undefined })
      .then(setInitiatives)
  }

  async function handleDelete(initiative: Initiative) {
    if (!confirm(`Delete "${initiative.name}"?`)) return
    try {
      await api.initiatives.remove(initiative.id)
      setInitiatives(prev => prev.filter(i => i.id !== initiative.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function handleToggleSelected(initiative: Initiative) {
    const next = !initiative.selected_for_development
    try {
      const updated = await api.initiatives.update(initiative.id, { selected_for_development: next })
      setInitiatives(prev => prev.map(i => i.id === initiative.id ? updated : i))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const filtered = filterStatus
    ? initiatives.filter(i => i.status === filterStatus)
    : initiatives

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Initiatives</h1>
          <p className="subtitle">{filtered.length} initiative{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add initiative</button>
      </div>

      <div className="filters">
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
          <option value="">All products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as InitiativeStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No initiatives yet.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add the first initiative</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Product</th>
                <th>Status</th>
                <th>Source</th>
                <th className="col-effort">Effort (mo)</th>
                <th>PRD</th>
                <th className="col-selected">For dev</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(initiative => (
                <tr key={initiative.id} className={initiative.selected_for_development ? 'row-selected-for-dev' : undefined}>
                  <td>
                    <div className="initiative-name">{initiative.name}</div>
                    {initiative.description && (
                      <div className="initiative-desc">{initiative.description}</div>
                    )}
                  </td>
                  <td>{initiative.product.name}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ '--badge-color': STATUS_COLORS[initiative.status] } as React.CSSProperties}
                    >
                      {STATUS_LABELS[initiative.status]}
                    </span>
                  </td>
                  <td className="source-cell">{initiative.source === 'tech' ? 'Tech' : 'Product'}</td>
                  <td className="col-effort">
                    {initiative.effort_months != null ? initiative.effort_months : '—'}
                  </td>
                  <td>
                    {initiative.prd_link ? (
                      <a href={initiative.prd_link} target="_blank" rel="noreferrer" className="prd-link">PRD ↗</a>
                    ) : '—'}
                  </td>
                  <td className="col-selected">
                    <button
                      className={`select-dev-btn${initiative.selected_for_development ? ' select-dev-btn--on' : ''}`}
                      onClick={() => handleToggleSelected(initiative)}
                      aria-label={initiative.selected_for_development ? 'Remove from development' : 'Select for development'}
                      title={initiative.selected_for_development ? 'Remove from development' : 'Select for development'}
                    >
                      {initiative.selected_for_development ? '★' : '☆'}
                    </button>
                  </td>
                  <td className="col-actions">
                    <button className="btn-ghost icon-btn" onClick={() => setEditing(initiative)} aria-label="Edit">✎</button>
                    <button className="btn-ghost icon-btn danger-btn" onClick={() => handleDelete(initiative)} aria-label="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showModal || editing) && (
        <AddInitiativeModal
          products={products}
          initiative={editing ?? undefined}
          defaultProductId={filterProduct || undefined}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
