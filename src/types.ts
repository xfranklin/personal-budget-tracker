export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  icon: string // icon name/class from Vuestic/Material icons
  color: string // hex color code
  type: TransactionType
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  categoryId: string
  date: string // ISO date string (YYYY-MM-DD)
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
