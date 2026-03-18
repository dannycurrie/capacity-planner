import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET /products — list all active products
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('archived', false)
    .order('name')

  if (error) throw error
  res.json(data)
})

// POST /products — create a product
router.post('/', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await supabase
    .from('products')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) throw error
  res.status(201).json(data)
})

// PATCH /products/:id — rename a product
router.patch('/:id', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const { data, error } = await supabase
    .from('products')
    .update({ name: name.trim() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) throw error
  res.json(data)
})

// PATCH /products/:id/archive — archive a product
router.patch('/:id/archive', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .update({ archived: true })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) throw error
  res.json(data)
})

export default router
