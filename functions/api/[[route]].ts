import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { sign, jwt } from 'hono/jwt'
import type { ApiResponse, Transaction, Category } from '../../src/types'

type Bindings = {
  DB: D1Database
  PASSWORD: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// Healthcheck Route (Public)
app.get('/health', c => c.json({ success: true, message: 'Server is healthy!' }))

// Single-User Login Route (Public)
app.post('/auth/login', async c => {
  try {
    const { password } = await c.req.json<{ password?: string }>()
    if (!password) {
      return c.json<ApiResponse>({ success: false, error: 'Password is required.' }, 400)
    }

    if (password !== c.env.PASSWORD) {
      return c.json<ApiResponse>({ success: false, error: 'Incorrect password.' }, 401)
    }

    // Sign a cryptographically secure JWT token valid for 30 days
    const payload = {
      sub: 'single-user',
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days life
    }
    const token = await sign(payload, c.env.JWT_SECRET)

    return c.json<ApiResponse<{ token: string }>>({
      success: true,
      data: { token },
    })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Unified JWT Security Middleware protecting all private endpoints
app.use('*', async (c, next) => {
  const path = c.req.path
  // Exclude healthcheck and login paths from JWT verification
  if (path === '/api/health' || path === '/api/auth/login') {
    return next()
  }

  // Verify JWT signature using JWT_SECRET
  try {
    const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })
    return await jwtMiddleware(c, next)
  } catch {
    return c.json<ApiResponse>(
      { success: false, error: 'Unauthorized: Invalid or expired token.' },
      401,
    )
  }
})

// Fetch all transactions (Protected)
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

// Fetch system and user categories (Protected)
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

// Add new transaction (Protected)
app.post('/transactions', async c => {
  try {
    const body = await c.req.json<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>()

    if (!body.amount || body.amount <= 0 || !body.categoryId || !body.type || !body.date) {
      return c.json<ApiResponse>({ success: false, error: 'Missing or invalid parameters.' }, 400)
    }

    const id = `t-${Date.now()}`
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'INSERT INTO transactions (id, amount, type, category_id, date, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        id,
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

// Delete transaction (Protected)
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
