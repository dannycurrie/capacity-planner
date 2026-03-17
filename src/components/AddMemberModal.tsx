import { useEffect, useRef, useState } from 'react'
import type { Team, Product } from '../types'
import { api } from '../api'

interface Props {
  teams: Team[]
  products: Product[]
  onSave: () => void
  onClose: () => void
}

const EMPTY = { name: '', role: '', fte: '1', team_id: '', product_id: '' }

export function AddMemberModal({ teams, products, onSave, onClose }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  function set(field: keyof typeof EMPTY, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const fte = parseFloat(form.fte)
    if (!form.name.trim()) return setError('Name is required')
    if (!form.role.trim()) return setError('Role is required')
    if (!form.team_id) return setError('Team is required')
    if (!form.product_id) return setError('Product is required')
    if (isNaN(fte) || fte <= 0 || fte > 1) return setError('FTE must be between 0 and 1')

    setSaving(true)
    try {
      await api.members.create({ name: form.name.trim(), role: form.role.trim(), fte, team_id: form.team_id, product_id: form.product_id })
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Add team member</h2>
          <button className="btn-ghost icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <label>
              Name
              <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
            </label>
            <label>
              Role
              <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Senior Engineer" />
            </label>
            <label>
              Team
              <select value={form.team_id} onChange={e => set('team_id', e.target.value)}>
                <option value="">Select team…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>
              Product
              <select value={form.product_id} onChange={e => set('product_id', e.target.value)}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>
              FTE
              <input type="number" value={form.fte} onChange={e => set('fte', e.target.value)} min="0.1" max="1" step="0.1" />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
