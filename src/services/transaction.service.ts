import HttpService from './http.service'
import type { ApiResponse, Transaction, Category } from '@/types'

export class TransactionService {
  private readonly http: HttpService

  constructor(baseUrl = '/api') {
    this.http = new HttpService(baseUrl)
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>('/transactions')
  }

  async createTransaction(
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>('/transactions', { body: payload })
  }

  async deleteTransaction(id: string): Promise<ApiResponse> {
    return this.http.delete<ApiResponse>(`/transactions/${id}`)
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>('/categories')
  }
}
export default TransactionService
