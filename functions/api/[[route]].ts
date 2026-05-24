import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import type { ApiResponse, Transaction, Category } from '../../src/types'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// Healthcheck Route
app.get('/health', c => c.json({ success: true, message: 'Server is healthy!' }))

// Fetch all transactions
app.get('/transactions', async c => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM transactions ORDER BY date DESC',
    ).all<Transaction>()
    return c.json<ApiResponse<Transaction[]>>({ success: true, data: results })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Fetch system and user categories
app.get('/categories', async c => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM categories ORDER BY type ASC, name ASC',
    ).all<Category>()
    return c.json<ApiResponse<Category[]>>({ success: true, data: results })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Add new transaction
app.post('/transactions', async c => {
  try {
    const body = await c.req.json<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>()

    if (!body.amount || body.amount <= 0 || !body.categoryId || !body.type || !body.date) {
      return c.json<ApiResponse>({ success: false, error: 'Missing or invalid parameters.' }, 400)
    }

    const id = `t-${Date.now()}`
    const userId = 'demo-user'
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'INSERT INTO transactions (id, user_id, amount, type, category_id, date, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        id,
        userId,
        body.amount,
        body.type,
        body.categoryId,
        body.date,
        body.description || null,
        now,
        now,
      )
      .run()

    return c.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Delete transaction
app.delete('/transactions/:id', async c => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run()
    return c.json<ApiResponse>({ success: true })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

export const onRequest = handle(app)
