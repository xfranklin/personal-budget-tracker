import HttpService from './http.service'
import type { ApiResponse, Transaction, Category } from '@/types'

export interface TransactionsPageParams {
  startDate?: string | null
  endDate?: string | null
  limit: number
  offset: number
}

export interface TransactionsPage {
  items: Transaction[]
  totalCount: number
  totalIncome: number
  totalExpense: number
}

export class TransactionService {
  private readonly http: HttpService

  constructor(baseUrl = '/api') {
    this.http = new HttpService(baseUrl)
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>('/transactions')
  }

  async getTransactionsPage(
    params: TransactionsPageParams,
  ): Promise<ApiResponse<TransactionsPage>> {
    return this.http.get<ApiResponse<TransactionsPage>>('/transactions', { body: params })
  }

  async createTransaction(
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>('/transactions', { body: payload })
  }

  async deleteTransaction(id: string): Promise<ApiResponse> {
    return this.http.delete<ApiResponse>(`/transactions/${id}`)
  }

  async deleteTransactionsByPeriod(startDate: string, endDate: string): Promise<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `/transactions/bulk?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    )
  }

  async updateTransaction(
    id: string,
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiResponse> {
    return this.http.put<ApiResponse>(`/transactions/${id}`, { body: payload })
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>('/categories')
  }

  async createCategory(
    payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'is_default' | 'color'>,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>('/categories', { body: payload })
  }

  async updateCategory(
    id: string,
    payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'is_default' | 'color'>,
  ): Promise<ApiResponse> {
    return this.http.put<ApiResponse>(`/categories/${id}`, { body: payload })
  }

  async deleteCategory(id: string): Promise<ApiResponse> {
    return this.http.delete<ApiResponse>(`/categories/${id}`)
  }
}
export default TransactionService
