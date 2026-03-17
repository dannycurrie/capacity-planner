import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET /teams — list all active teams
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('archived', false)
    .order('name')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /teams — create a team
router.post('/', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await supabase
    .from('teams')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PATCH /teams/:id — rename a team
router.patch('/:id', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await supabase
    .from('teams')
    .update({ name: name.trim() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /teams/:id/archive — archive a team
router.patch('/:id/archive', async (req, res) => {
  const { data, error } = await supabase
    .from('teams')
    .update({ archived: true })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
