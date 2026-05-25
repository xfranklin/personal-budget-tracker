import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { sign, jwt } from 'hono/jwt'
import type { ApiResponse, Transaction, Category } from '../../src/types'

type Bindings = {
  DB: D1Database
  PASSWORD: string
  JWT_SECRET: string
}

type TransactionsPage = {
  items: Transaction[]
  totalCount: number
  totalIncome: number
  totalExpense: number
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
    const limitQuery = c.req.query('limit')
    const offsetQuery = c.req.query('offset')
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')

    if (limitQuery || offsetQuery || startDate || endDate) {
      const limit = Math.min(Math.max(Number(limitQuery) || 25, 1), 100000)
      const offset = Math.max(Number(offsetQuery) || 0, 0)
      const whereParts: string[] = []
      const bindings: Array<number | string> = []

      if (startDate && endDate) {
        whereParts.push('date >= ? AND date <= ?')
        bindings.push(startDate, endDate)
      }

      const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

      const { results } = await c.env.DB.prepare(
        `
          SELECT
            id,
            amount,
            type,
            category_id AS categoryId,
            date,
            description,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM transactions
          ${whereClause}
          ORDER BY date DESC, created_at DESC
          LIMIT ? OFFSET ?
        `,
      )
        .bind(...bindings, limit, offset)
        .all<Transaction>()

      const summary = await c.env.DB.prepare(
        `
          SELECT
            COUNT(*) AS totalCount,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
          FROM transactions
          ${whereClause}
        `,
      )
        .bind(...bindings)
        .first<{ totalCount: number; totalIncome: number; totalExpense: number }>()

      return c.json<ApiResponse<TransactionsPage>>({
        success: true,
        data: {
          items: results,
          totalCount: summary?.totalCount || 0,
          totalIncome: summary?.totalIncome || 0,
          totalExpense: summary?.totalExpense || 0,
        },
      })
    }

    const { results } = await c.env.DB.prepare(
      `
        SELECT
          id,
          amount,
          type,
          category_id AS categoryId,
          date,
          description,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM transactions
        ORDER BY date DESC
      `,
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
      `
        SELECT
          id,
          name,
          icon,
          color,
          type,
          group_name,
          is_default,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM categories
        ORDER BY type ASC, name ASC
      `,
    ).all<Category>()
    return c.json<ApiResponse<Category[]>>({ success: true, data: results })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

const GROUP_COLORS: Record<string, string> = {
  food_drinks: '#ff9100',
  shopping: '#8e44ad',
  housing: '#2979ff',
  transportation: '#0288d1',
  vehicle: '#455a64',
  life_entertainment: '#ff1744',
  communication_pc: '#00acc1',
  financial_expenses: '#607d8b',
  investments: '#2e7d32',
  others: '#78909c',
  income: '#00a878',
}

// Add new category (Protected)
app.post('/categories', async c => {
  try {
    const body =
      await c.req.json<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'is_default' | 'color'>>()

    if (!body.name || !body.icon || !body.group_name || !body.type) {
      return c.json<ApiResponse>({ success: false, error: 'Missing or invalid parameters.' }, 400)
    }

    if (body.type !== 'income' && body.type !== 'expense') {
      return c.json<ApiResponse>({ success: false, error: 'Invalid category type.' }, 400)
    }

    const color = GROUP_COLORS[body.group_name]
    if (!color) {
      return c.json<ApiResponse>({ success: false, error: 'Invalid category group.' }, 400)
    }

    const id = `c-${Date.now()}`
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'INSERT INTO categories (id, name, icon, color, type, group_name, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(id, body.name, body.icon, color, body.type, body.group_name, 0, now, now)
      .run()

    return c.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Update category (Protected)
app.put('/categories/:id', async c => {
  try {
    const id = c.req.param('id')
    const body =
      await c.req.json<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'is_default' | 'color'>>()

    if (!body.name || !body.icon || !body.group_name || !body.type) {
      return c.json<ApiResponse>({ success: false, error: 'Missing or invalid parameters.' }, 400)
    }

    if (body.type !== 'income' && body.type !== 'expense') {
      return c.json<ApiResponse>({ success: false, error: 'Invalid category type.' }, 400)
    }

    const color = GROUP_COLORS[body.group_name]
    if (!color) {
      return c.json<ApiResponse>({ success: false, error: 'Invalid category group.' }, 400)
    }

    // Check if category is system default
    const existing = await c.env.DB.prepare('SELECT is_default FROM categories WHERE id = ?')
      .bind(id)
      .first<{ is_default: number }>()

    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Category not found.' }, 404)
    }

    if (existing.is_default === 1) {
      return c.json<ApiResponse>(
        { success: false, error: 'Cannot modify system default categories.' },
        400,
      )
    }

    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE categories SET name = ?, icon = ?, color = ?, type = ?, group_name = ?, updated_at = ? WHERE id = ?',
    )
      .bind(body.name, body.icon, color, body.type, body.group_name, now, id)
      .run()

    return c.json<ApiResponse>({
      success: true,
    })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Delete category (Protected)
app.delete('/categories/:id', async c => {
  try {
    const id = c.req.param('id')

    // Check if category is system default
    const existing = await c.env.DB.prepare('SELECT is_default FROM categories WHERE id = ?')
      .bind(id)
      .first<{ is_default: number }>()

    if (!existing) {
      return c.json<ApiResponse>({ success: false, error: 'Category not found.' }, 404)
    }

    if (existing.is_default === 1) {
      return c.json<ApiResponse>(
        { success: false, error: 'Cannot delete system default categories.' },
        400,
      )
    }

    // Check if category has associated transactions
    const txCheck = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
    )
      .bind(id)
      .first<{ count: number }>()

    if (txCheck && txCheck.count > 0) {
      return c.json<ApiResponse>(
        {
          success: false,
          error:
            'Cannot delete category with active transactions. Reassign or delete those transactions first.',
        },
        400,
      )
    }

    await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()

    return c.json<ApiResponse>({
      success: true,
    })
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

// Update transaction (Protected)
app.put('/transactions/:id', async c => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>()

    if (!body.amount || body.amount <= 0 || !body.categoryId || !body.type || !body.date) {
      return c.json<ApiResponse>({ success: false, error: 'Missing or invalid parameters.' }, 400)
    }

    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE transactions SET amount = ?, type = ?, category_id = ?, date = ?, description = ?, updated_at = ? WHERE id = ?',
    )
      .bind(body.amount, body.type, body.categoryId, body.date, body.description || null, now, id)
      .run()

    return c.json<ApiResponse>({
      success: true,
    })
  } catch (err) {
    return c.json<ApiResponse>({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// Delete bulk transactions by period (Protected)
app.delete('/transactions/bulk', async c => {
  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')

    if (!startDate || !endDate) {
      return c.json<ApiResponse>(
        { success: false, error: 'startDate and endDate are required for bulk deletion.' },
        400,
      )
    }

    await c.env.DB.prepare('DELETE FROM transactions WHERE date >= ? AND date <= ?')
      .bind(startDate, endDate)
      .run()

    return c.json<ApiResponse>({ success: true })
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
