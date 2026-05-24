import { defineStore } from 'pinia'
import type { Transaction, Category } from '@/types'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    transactions: [
      {
        id: 't-1',
        userId: 'demo-user',
        amount: 3200,
        type: 'income',
        categoryId: 'c-4',
        date: new Date().toISOString().split('T')[0],
        description: 'Monthly Salary Paycheck',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        userId: 'demo-user',
        amount: 1200,
        type: 'expense',
        categoryId: 'c-2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        description: 'Modern Apartment Rent',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 't-3',
        userId: 'demo-user',
        amount: 154.5,
        type: 'expense',
        categoryId: 'c-1',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        description: 'Weekly Organic Groceries',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 't-4',
        userId: 'demo-user',
        amount: 450,
        type: 'income',
        categoryId: 'c-5',
        date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
        description: 'Consulting Project Milestone',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 't-5',
        userId: 'demo-user',
        amount: 45,
        type: 'expense',
        categoryId: 'c-3',
        date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
        description: 'Premium Fuel Refill',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        updatedAt: new Date(Date.now() - 345600000).toISOString(),
      },
    ] as Transaction[],
    categories: [
      {
        id: 'c-1',
        userId: null,
        name: 'Groceries',
        icon: 'local_grocery_store',
        color: '#ff9100',
        type: 'expense',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'c-2',
        userId: null,
        name: 'Rent & Living',
        icon: 'home',
        color: '#2979ff',
        type: 'expense',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'c-3',
        userId: null,
        name: 'Transport',
        icon: 'directions_car',
        color: '#00e5ff',
        type: 'expense',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'c-4',
        userId: null,
        name: 'Salary',
        icon: 'payments',
        color: '#00e676',
        type: 'income',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'c-5',
        userId: null,
        name: 'Freelance & Business',
        icon: 'corporate_fare',
        color: '#d500f9',
        type: 'income',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'c-6',
        userId: null,
        name: 'Leisure & Fun',
        icon: 'sports_esports',
        color: '#ff1744',
        type: 'expense',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as Category[],
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
    addTransaction(payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
      const newTransaction: Transaction = {
        ...payload,
        id: `t-${Date.now()}`,
        userId: 'demo-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.transactions.push(newTransaction)
    },
    deleteTransaction(id: string) {
      this.transactions = this.transactions.filter(t => t.id !== id)
    },
    addCategory(payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
      const newCategory: Category = {
        ...payload,
        id: `c-${Date.now()}`,
        userId: 'demo-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.categories.push(newCategory)
    },
  },
})
