import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { supabase } from './db.js'
import teamsRouter from './routes/teams.js'
import productsRouter from './routes/products.js'
import membersRouter from './routes/members.js'
import capacityRouter from './routes/capacity.js'
import initiativesRouter from './routes/initiatives.js'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? '*',
}))
app.use(express.json())

app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`)
  next()
})

app.use('/teams', teamsRouter)
app.use('/products', productsRouter)
app.use('/members', membersRouter)
app.use('/capacity', capacityRouter)
app.use('/initiatives', initiativesRouter)

app.get('/health', async (_req, res) => {
  const { error } = await supabase.from('teams').select('id').limit(1)
  res.json({ status: error ? 'db_error' : 'ok', ...(error && { error: error.message }) })
})

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`✗ ${req.method} ${req.path}`, err)
  const message = err instanceof Error
    ? err.message
    : (err as Record<string, unknown>)?.message
      ? String((err as Record<string, unknown>).message)
      : String(err)
  res.status(500).json({ error: message, detail: err })
})

export default app
