import { useEffect, useRef, useState } from 'react'
import type { Product, Initiative, InitiativeStatus, InitiativeSource } from '../types'
import { api } from '../api'

interface Props {
  products: Product[]
  initiative?: Initiative
  defaultProductId?: string
  onSave: () => void
  onClose: () => void
}

const STATUSES: { value: InitiativeStatus; label: string }[] = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'selected', label: 'Selected' },
  { value: 'in_development', label: 'In Development' },
  { value: 'released', label: 'Released' },
  { value: 'backburner', label: 'Backburner' },
  { value: 'rejected', label: 'Rejected' },
]

const EMPTY = {
  product_id: '',
  name: '',
  description: '',
  effort_months: '',
  status: 'proposed' as InitiativeStatus,
  prd_link: '',
  source: 'product' as InitiativeSource,
}

export function AddInitiativeModal({ products, initiative, defaultProductId, onSave, onClose }: Props) {
  const [form, setForm] = useState(() =>
    initiative
      ? {
          product_id: initiative.product_id,
          name: initiative.name,
          description: initiative.description ?? '',
          effort_months: initiative.effort_months != null ? String(initiative.effort_months) : '',
          status: initiative.status,
          prd_link: initiative.prd_link ?? '',
          source: initiative.source,
        }
      : { ...EMPTY, product_id: defaultProductId ?? '' }
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  function set<K extends keyof typeof EMPTY>(field: K, value: (typeof EMPTY)[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('Name is required')
    if (!form.product_id) return setError('Product is required')

    const effort = form.effort_months ? parseFloat(form.effort_months) : null
    if (form.effort_months && (isNaN(effort!) || effort! <= 0)) {
      return setError('Effort must be a positive number')
    }

    setSaving(true)
    try {
      const payload = {
        product_id: form.product_id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        effort_months: effort,
        status: form.status,
        prd_link: form.prd_link.trim() || undefined,
        source: form.source,
      }
      if (initiative) {
        await api.initiatives.update(initiative.id, payload)
      } else {
        await api.initiatives.create(payload)
      }
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initiative

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal initiative-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">{isEdit ? 'Edit initiative' : 'Add initiative'}</h2>
          <button className="btn-ghost icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <label className="span-2">
              Name
              <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Initiative name" />
            </label>
            <label className="span-2">
              Description
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="What is this initiative about?"
                rows={3}
              />
            </label>
            <label>
              Product
              <select value={form.product_id} onChange={e => set('product_id', e.target.value)}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={e => set('status', e.target.value as InitiativeStatus)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label>
              Effort (person months)
              <input
                type="number"
                value={form.effort_months}
                onChange={e => set('effort_months', e.target.value)}
                placeholder="e.g. 3"
                min="0.1"
                step="0.5"
              />
            </label>
            <label>
              Source
              <select value={form.source} onChange={e => set('source', e.target.value as InitiativeSource)}>
                <option value="product">Product</option>
                <option value="tech">Tech</option>
              </select>
            </label>
            <label className="span-2">
              PRD Link
              <input
                type="url"
                value={form.prd_link}
                onChange={e => set('prd_link', e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add initiative'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
