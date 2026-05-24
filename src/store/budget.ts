import { defineStore } from 'pinia'
import type { Transaction, Category } from '@/types'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    transactions: [] as Transaction[],
    categories: [] as Category[],
  }),

  getters: {
    totalIncome(): number {
      return this.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
    },
    totalExpense(): number {
      return this.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    },
    netBalance(): number {
      return this.totalIncome - this.totalExpense
    },
    transactionsWithCategory(): Array<Transaction & { category?: Category }> {
      return this.transactions
        .map(t => ({
          ...t,
          category: this.categories.find(c => c.id === t.categoryId),
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
  },

  actions: {
    setTransactions(transactions: Transaction[]) {
      this.transactions = transactions
    },
    setCategories(categories: Category[]) {
      this.categories = categories
    },
    appendTransaction(transaction: Transaction) {
      this.transactions.push(transaction)
    },
    removeTransaction(id: string) {
      this.transactions = this.transactions.filter(t => t.id !== id)
    },
    appendCategory(category: Category) {
      this.categories.push(category)
    },
  },
})
