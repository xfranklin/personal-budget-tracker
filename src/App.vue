<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/store/budget'
import { useServices } from '@/services'
import type { TransactionType, Transaction, Category, ApiResponse } from '@/types'

const budgetStore = useBudgetStore()
const { transactions } = useServices()

// Authorization State
const isAuthorized = ref(!!localStorage.getItem('auth_token'))
const passwordInput = ref('')
const authError = ref('')
const isAuthenticating = ref(false)

// State for new transaction form
const amount = ref<number | null>(null)
const type = ref<TransactionType>('expense')
const categoryId = ref<string>('')
const date = ref<string>(new Date().toISOString().split('T')[0])
const description = ref<string>('')

// Fallback seed mock data for standalone/offline runs
const defaultMockCategories: Category[] = [
  {
    id: 'c-1',
    name: 'Groceries',
    icon: 'local_grocery_store',
    color: '#ff9100',
    type: 'expense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-2',
    name: 'Rent & Living',
    icon: 'home',
    color: '#2979ff',
    type: 'expense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-3',
    name: 'Transport',
    icon: 'directions_car',
    color: '#00e5ff',
    type: 'expense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-4',
    name: 'Salary',
    icon: 'payments',
    color: '#00e676',
    type: 'income',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-5',
    name: 'Freelance & Business',
    icon: 'corporate_fare',
    color: '#d500f9',
    type: 'income',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c-6',
    name: 'Leisure & Fun',
    icon: 'sports_esports',
    color: '#ff1744',
    type: 'expense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const defaultMockTransactions: Transaction[] = [
  {
    id: 't-1',
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
    amount: 45,
    type: 'expense',
    categoryId: 'c-3',
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    description: 'Premium Fuel Refill',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
  },
]

// Filter categories based on transaction type
const filteredCategories = computed(() => {
  return budgetStore.categories.filter(c => c.type === type.value)
})

// Set initial category when type changes
const onTypeChange = () => {
  const cats = filteredCategories.value
  categoryId.value = cats.length > 0 ? cats[0].id : ''
}

// Reset credentials if unauthorized error occurs
const handleAuthError = (err: unknown) => {
  const isUnauthorized =
    err instanceof Error
      ? err.message === 'Unauthorized'
      : typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        (err as { message: unknown }).message === 'Unauthorized'

  if (isUnauthorized) {
    isAuthorized.value = false
    budgetStore.setTransactions([])
    budgetStore.setCategories([])
    authError.value = 'Session expired. Please log in again.'
  }
}

// Fetch categories and transactions on mount
const loadData = async () => {
  if (!isAuthorized.value) return

  try {
    const [txRes, catRes] = await Promise.all([
      transactions.getTransactions(),
      transactions.getCategories(),
    ])

    if (txRes.success && txRes.data) {
      budgetStore.setTransactions(txRes.data)
    } else {
      budgetStore.setTransactions(defaultMockTransactions)
    }

    if (catRes.success && catRes.data && catRes.data.length > 0) {
      budgetStore.setCategories(catRes.data)
    } else {
      budgetStore.setCategories(defaultMockCategories)
    }
  } catch (err) {
    handleAuthError(err)
    if (isAuthorized.value) {
      console.warn('API services offline. Falling back to local mock data.', err)
      budgetStore.setTransactions(defaultMockTransactions)
      budgetStore.setCategories(defaultMockCategories)
    }
  }
  onTypeChange()
}

onMounted(() => {
  loadData()
})

// Login Submission
const handleLogin = async () => {
  if (!passwordInput.value) return
  isAuthenticating.value = true
  authError.value = ''

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value }),
    })
    const result = (await response.json()) as ApiResponse<{ token: string }>

    if (response.ok && result.success && result.data) {
      localStorage.setItem('auth_token', result.data.token)
      isAuthorized.value = true
      passwordInput.value = ''
      loadData()
    } else {
      authError.value = result.error || 'Access denied: Incorrect password.'
    }
  } catch {
    authError.value = 'Network error: Cannot reach authentication gateway.'
  } finally {
    isAuthenticating.value = false
  }
}

// Logout / Lock Portal
const handleLogout = () => {
  localStorage.removeItem('auth_token')
  isAuthorized.value = false
  budgetStore.setTransactions([])
  budgetStore.setCategories([])
  authError.value = ''
}

// Form submission
const isSubmitting = ref(false)
const handleSubmit = async () => {
  if (!amount.value || amount.value <= 0 || !categoryId.value) return

  isSubmitting.value = true
  const payload = {
    amount: amount.value,
    type: type.value,
    categoryId: categoryId.value,
    date: date.value,
    description: description.value || undefined,
  }

  try {
    const response = await transactions.createTransaction(payload)
    const newTx: Transaction = {
      ...payload,
      id: response.success && response.data ? response.data.id : `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    budgetStore.appendTransaction(newTx)
  } catch (err) {
    handleAuthError(err)
    if (isAuthorized.value) {
      console.warn('Backend persistence failed. Saving transaction locally.', err)
      budgetStore.appendTransaction({
        ...payload,
        id: `t-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  // Reset form
  amount.value = null
  description.value = ''
  isSubmitting.value = false
}

// Delete transaction
const handleDelete = async (id: string) => {
  // Optimistically remove locally
  budgetStore.removeTransaction(id)

  try {
    await transactions.deleteTransaction(id)
  } catch (err) {
    handleAuthError(err)
  }
}

// Active PWA tracking
const isOnline = ref(navigator.onLine)
window.addEventListener('online', () => {
  isOnline.value = true
})
window.addEventListener('offline', () => {
  isOnline.value = false
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}
</script>

<template>
  <!-- Lockscreen Portal Overlay -->
  <div v-if="!isAuthorized" class="login-overlay">
    <div class="glass-panel login-card glowing-border">
      <div class="login-header">
        <div class="login-icon-wrapper">
          <va-icon name="lock" color="primary" size="large" class="pulse-animation" />
        </div>
        <h2>Private Access Portal</h2>
        <p>This Secure Budget Tracker requires password authorization.</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Portal Password</label>
          <va-input
            v-model="passwordInput"
            type="password"
            placeholder="••••••••••••"
            required
            outline
            class="w-full"
            :error="!!authError"
            :error-messages="authError"
          >
            <template #prependInner>
              <va-icon name="vpn_key" color="textSecondary" />
            </template>
          </va-input>
        </div>
        <va-button
          type="submit"
          color="primary"
          class="w-full submit-button"
          icon="vpn_key"
          :loading="isAuthenticating"
        >
          Unlock Dashboard
        </va-button>
      </form>
    </div>
  </div>

  <!-- Primary Authorized Layout -->
  <div v-else class="dashboard-container">
    <!-- Glassmorphic Navbar -->
    <header class="glass-panel main-header glowing-border">
      <div class="header-left">
        <div class="brand-logo">
          <va-icon name="payments" color="primary" size="large" />
          <h1 class="logo-title">AntiGravity <span class="accent-text">Budget</span></h1>
        </div>
      </div>
      <div class="header-right">
        <div class="nav-actions">
          <va-badge
            :text="isOnline ? 'PWA Synchronized' : 'Offline Mode'"
            :color="isOnline ? 'success' : 'warning'"
            class="pwa-badge"
          />
          <va-button
            preset="secondary"
            icon="logout"
            color="textSecondary"
            size="small"
            class="logout-btn"
            @click="handleLogout"
          >
            Lock
          </va-button>
        </div>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="row metrics-row">
      <div class="flex xs12 md4">
        <div class="glass-panel metric-card glowing-border">
          <div class="card-glow-bg success-glow"></div>
          <div class="metric-info">
            <span class="metric-label">Total Inflow</span>
            <span class="metric-value glow-text-success">{{
              formatCurrency(budgetStore.totalIncome)
            }}</span>
          </div>
          <div class="metric-icon success-icon">
            <va-icon name="trending_up" color="#00e5ff" size="large" />
          </div>
        </div>
      </div>

      <div class="flex xs12 md4">
        <div class="glass-panel metric-card glowing-border">
          <div class="card-glow-bg danger-glow"></div>
          <div class="metric-info">
            <span class="metric-label">Total Outflow</span>
            <span class="metric-value glow-text-danger">{{
              formatCurrency(budgetStore.totalExpense)
            }}</span>
          </div>
          <div class="metric-icon danger-icon">
            <va-icon name="trending_down" color="#ff1744" size="large" />
          </div>
        </div>
      </div>

      <div class="flex xs12 md4">
        <div class="glass-panel metric-card glowing-border">
          <div class="card-glow-bg primary-glow"></div>
          <div class="metric-info">
            <span class="metric-label">Active Balance</span>
            <span class="metric-value glow-text-primary">{{
              formatCurrency(budgetStore.netBalance)
            }}</span>
          </div>
          <div class="metric-icon primary-icon">
            <va-icon name="account_balance_wallet" color="#154ec1" size="large" />
          </div>
        </div>
      </div>
    </div>

    <!-- Content Workspace -->
    <div class="row content-row">
      <!-- Left Column: History & Breakdown -->
      <div class="flex xs12 md8">
        <div class="glass-panel section-card">
          <div class="section-header">
            <div class="section-title">
              <va-icon name="history" size="medium" />
              <h2>Transaction History</h2>
            </div>
            <span class="badge-total">{{ budgetStore.transactions.length }} transactions</span>
          </div>

          <div class="transactions-list">
            <TransitionGroup name="list" tag="div">
              <div
                v-for="item in budgetStore.transactionsWithCategory"
                :key="item.id"
                class="transaction-row"
              >
                <div class="tx-left">
                  <div
                    class="category-icon-wrapper"
                    :style="{
                      backgroundColor: item.category?.color + '20',
                      border: '1px solid ' + item.category?.color,
                    }"
                  >
                    <va-icon
                      :name="item.category?.icon || 'help'"
                      :color="item.category?.color || '#a5b0c0'"
                      size="medium"
                    />
                  </div>
                  <div class="tx-details">
                    <span class="tx-description">{{
                      item.description || item.category?.name
                    }}</span>
                    <span class="tx-meta">
                      <span class="tx-category">{{ item.category?.name }}</span>
                      <span class="tx-divider">•</span>
                      <span class="tx-date">{{ item.date }}</span>
                    </span>
                  </div>
                </div>
                <div class="tx-right">
                  <span
                    class="tx-amount"
                    :class="item.type === 'income' ? 'income-color' : 'expense-color'"
                  >
                    {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
                  </span>
                  <va-button
                    preset="plain"
                    icon="delete"
                    color="danger"
                    size="small"
                    class="delete-btn"
                    @click="handleDelete(item.id)"
                  />
                </div>
              </div>
            </TransitionGroup>

            <div v-if="budgetStore.transactions.length === 0" class="empty-state pulse-animation">
              <va-icon name="payments" size="large" color="textSecondary" />
              <p>No transactions registered yet. Record your first transaction using the form.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Add Transaction -->
      <div class="flex xs12 md4">
        <div class="glass-panel section-card form-card glowing-border">
          <div class="section-header">
            <div class="section-title">
              <va-icon name="add_circle" size="medium" />
              <h2>Add Transaction</h2>
            </div>
          </div>

          <form class="transaction-form" @submit.prevent="handleSubmit">
            <!-- Type Selector -->
            <div class="form-group type-selector">
              <va-button-toggle
                v-model="type"
                :options="[
                  { label: 'Expense', value: 'expense' },
                  { label: 'Income', value: 'income' },
                ]"
                color="primary"
                class="w-full"
                @update:model-value="onTypeChange"
              />
            </div>

            <!-- Amount Input -->
            <div class="form-group">
              <label class="form-label">Amount ($)</label>
              <va-input
                v-model.number="amount"
                type="number"
                placeholder="0.00"
                required
                outline
                class="w-full"
                step="0.01"
                min="0.01"
              >
                <template #prependInner>
                  <va-icon name="attach_money" color="textSecondary" />
                </template>
              </va-input>
            </div>

            <!-- Category Selector -->
            <div class="form-group">
              <label class="form-label">Category</label>
              <va-select
                v-model="categoryId"
                :options="filteredCategories"
                value-by="id"
                text-by="name"
                placeholder="Select category"
                required
                outline
                class="w-full animate-select"
              />
            </div>

            <!-- Date Selector -->
            <div class="form-group">
              <label class="form-label">Date</label>
              <va-input v-model="date" type="date" required outline class="w-full">
                <template #prependInner>
                  <va-icon name="calendar_today" color="textSecondary" />
                </template>
              </va-input>
            </div>

            <!-- Description Input -->
            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <va-input
                v-model="description"
                placeholder="e.g. Weekly organic food"
                outline
                class="w-full"
              >
                <template #prependInner>
                  <va-icon name="notes" color="textSecondary" />
                </template>
              </va-input>
            </div>

            <!-- Submit Button -->
            <va-button
              type="submit"
              color="primary"
              class="w-full submit-button"
              icon="check"
              :loading="isSubmitting"
              :disabled="!amount || amount <= 0 || !categoryId"
            >
              Add Entry
            </va-button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

// Glassmorphic Login Overlay
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgb(17 18 22 / 60%);
  background-image:
    radial-gradient(at 0% 0%, rgb(21 78 193 / 18%) 0, transparent 60%),
    radial-gradient(at 100% 100%, rgb(0 229 255 / 10%) 0, transparent 60%);
  backdrop-filter: blur(28px);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 32px;
  background: rgb(27 29 35 / 75%);
  box-shadow: 0 24px 80px rgb(0 0 0 / 50%);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 16px 0 8px;
    color: #f8f9fa;
  }

  p {
    font-size: 0.88rem;
    color: #a5b0c0;
    line-height: 1.45;
  }
}

.login-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 20px;
  background: rgb(21 78 193 / 10%);
  border: 1px solid rgb(21 78 193 / 30%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgb(21 78 193 / 20%);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 28px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.accent-text {
  color: #154ec1;
  text-shadow: 0 0 16px rgb(21 78 193 / 40%);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pwa-badge {
  padding: 6px 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.logout-btn {
  font-weight: 600;
}

.metrics-row {
  margin-bottom: 24px;
  gap: 16px 0;
}

.metric-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  overflow: hidden;
  position: relative;
}

.card-glow-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  filter: blur(60px);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}

.success-glow {
  background: rgb(0 229 255 / 15%);
}

.danger-glow {
  background: rgb(255 23 68 / 15%);
}

.primary-glow {
  background: rgb(21 78 193 / 15%);
}

.metric-info {
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.metric-label {
  font-size: 0.85rem;
  color: #a5b0c0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.success-icon {
  background: rgb(0 229 255 / 10%);
}

.danger-icon {
  background: rgb(255 23 68 / 10%);
}

.primary-icon {
  background: rgb(21 78 193 / 10%);
}

.content-row {
  gap: 24px 0;
}

.section-card {
  padding: 24px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.form-card {
  min-height: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgb(255 255 255 / 5%);
  padding-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
  }
}

.badge-total {
  font-size: 0.8rem;
  color: #a5b0c0;
  background: rgb(255 255 255 / 5%);
  padding: 4px 8px;
  border-radius: 6px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}

.transaction-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgb(255 255 255 / 2%);
  border: 1px solid rgb(255 255 255 / 4%);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgb(255 255 255 / 4%);
    border-color: rgb(255 255 255 / 8%);
    transform: translateX(2px);
  }
}

.tx-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tx-details {
  display: flex;
  flex-direction: column;
}

.tx-description {
  font-weight: 600;
  font-size: 0.95rem;
  color: #f8f9fa;
}

.tx-meta {
  font-size: 0.78rem;
  color: #a5b0c0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tx-divider {
  opacity: 0.5;
}

.tx-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tx-amount {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.income-color {
  color: #00e5ff;
}

.expense-color {
  color: #ff1744;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;

  .transaction-row:hover & {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  text-align: center;
  gap: 12px;
  padding: 40px 20px;
  color: #a5b0c0;

  p {
    font-size: 0.9rem;
    max-width: 280px;
  }
}

.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #a5b0c0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.w-full {
  width: 100%;
}

.submit-button {
  margin-top: 8px;
  padding: 10px 0;
}

// Transitions
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

// Select animation
.animate-select {
  transition: all 0.2s ease;
}
</style>
