import 'dotenv/config'
import express from 'express'
import { supabase } from './db.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(express.json())

app.get('/health', async (_req, res) => {
  const { error } = await supabase.from('teams').select('id').limit(1)
  res.json({ status: error ? 'db_error' : 'ok', ...(error && { error: error.message }) })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
