import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET /members?team_id=&product_id= — filterable roster of active members
router.get('/', async (req, res) => {
  let query = supabase
    .from('team_members')
    .select('*, team:teams(id, name), product:products(id, name)')
    .eq('archived', false)
    .order('name')

  if (req.query.team_id) query = query.eq('team_id', req.query.team_id as string)
  if (req.query.product_id) query = query.eq('product_id', req.query.product_id as string)

  const { data, error } = await query
  if (error) throw error
  res.json(data)
})

// POST /members — add a team member
router.post('/', async (req, res) => {
  const { name, role, fte = 1.0, team_id, product_id } = req.body

  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })
  if (!role?.trim()) return res.status(400).json({ error: 'role is required' })
  if (!team_id) return res.status(400).json({ error: 'team_id is required' })
  if (!product_id) return res.status(400).json({ error: 'product_id is required' })
  if (typeof fte !== 'number' || fte <= 0 || fte > 1) {
    return res.status(400).json({ error: 'fte must be a number between 0 and 1' })
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert({ name: name.trim(), role: role.trim(), fte, team_id, product_id })
    .select('*, team:teams(id, name), product:products(id, name)')
    .single()

  if (error) throw error
  res.status(201).json(data)
})

// PATCH /members/:id — edit a team member
router.patch('/:id', async (req, res) => {
  const { name, role, fte, team_id, product_id } = req.body
  const updates: Record<string, unknown> = {}

  if (name !== undefined) updates.name = name.trim()
  if (role !== undefined) updates.role = role.trim()
  if (team_id !== undefined) updates.team_id = team_id
  if (product_id !== undefined) updates.product_id = product_id
  if (fte !== undefined) {
    if (typeof fte !== 'number' || fte <= 0 || fte > 1) {
      return res.status(400).json({ error: 'fte must be a number between 0 and 1' })
    }
    updates.fte = fte
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'no fields to update' })
  }

  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', req.params.id)
    .select('*, team:teams(id, name), product:products(id, name)')
    .single()

  if (error) throw error
  res.json(data)
})

// DELETE /members/:id — soft delete (archive)
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('team_members')
    .update({ archived: true })
    .eq('id', req.params.id)

  if (error) throw error
  res.status(204).send()
})

export default router
