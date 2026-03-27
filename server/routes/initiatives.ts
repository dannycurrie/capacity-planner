import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET /initiatives — list initiatives, optionally filtered by product
router.get('/', async (req, res) => {
  let query = supabase
    .from('initiatives')
    .select('*, product:products(id, name)')
    .order('created_at', { ascending: false })

  if (req.query.product_id) {
    query = query.eq('product_id', req.query.product_id as string)
  }

  const { data, error } = await query
  if (error) throw error
  res.json(data)
})

// POST /initiatives — create an initiative
router.post('/', async (req, res) => {
  const { product_id, name, description, effort_months, status, prd_link, source, selected_for_development, start_month } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })
  if (!product_id) return res.status(400).json({ error: 'product_id is required' })

  const { data, error } = await supabase
    .from('initiatives')
    .insert({
      product_id,
      name: name.trim(),
      description: description?.trim() || null,
      effort_months: effort_months ?? null,
      status: status ?? 'proposed',
      prd_link: prd_link?.trim() || null,
      source: source ?? 'product',
      selected_for_development: selected_for_development ?? false,
      start_month: start_month ?? null,
    })
    .select('*, product:products(id, name)')
    .single()

  if (error) throw error
  res.status(201).json(data)
})

// PATCH /initiatives/:id — update an initiative
router.patch('/:id', async (req, res) => {
  const { name, description, effort_months, status, prd_link, source, product_id, selected_for_development, start_month } = req.body

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (description !== undefined) updates.description = description?.trim() || null
  if (effort_months !== undefined) updates.effort_months = effort_months
  if (status !== undefined) updates.status = status
  if (prd_link !== undefined) updates.prd_link = prd_link?.trim() || null
  if (source !== undefined) updates.source = source
  if (product_id !== undefined) updates.product_id = product_id
  if (selected_for_development !== undefined) updates.selected_for_development = selected_for_development
  if (start_month !== undefined) updates.start_month = start_month || null

  const { data, error } = await supabase
    .from('initiatives')
    .update(updates)
    .eq('id', req.params.id)
    .select('*, product:products(id, name)')
    .single()

  if (error) throw error
  res.json(data)
})

// DELETE /initiatives/:id — delete an initiative
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('initiatives')
    .delete()
    .eq('id', req.params.id)

  if (error) throw error
  res.status(204).send()
})

export default router
