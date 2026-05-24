<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetStore } from '@/store/budget'
import type { TransactionType } from '@/types'

const budgetStore = useBudgetStore()

// State for new transaction form
const amount = ref<number | null>(null)
const type = ref<TransactionType>('expense')
const categoryId = ref<string>('')
const date = ref<string>(new Date().toISOString().split('T')[0])
const description = ref<string>('')

// Filter categories based on transaction type
const filteredCategories = computed(() => {
  return budgetStore.categories.filter(c => c.type === type.value)
})

// Set initial category when type changes
const onTypeChange = () => {
  const cats = filteredCategories.value
  categoryId.value = cats.length > 0 ? cats[0].id : ''
}

// Initialize category
onTypeChange()

// Form submission
const isSubmitting = ref(false)
const handleSubmit = () => {
  if (!amount.value || amount.value <= 0 || !categoryId.value) return

  isSubmitting.value = true

  budgetStore.addTransaction({
    amount: amount.value,
    type: type.value,
    categoryId: categoryId.value,
    date: date.value,
    description: description.value || undefined,
  })

  // Reset form
  amount.value = null
  description.value = ''
  isSubmitting.value = false
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
  <div class="dashboard-container">
    <!-- Glassmorphic Navbar -->
    <header class="glass-panel main-header glowing-border">
      <div class="header-left">
        <div class="brand-logo">
          <va-icon name="payments" color="primary" size="large" />
          <h1 class="logo-title">AntiGravity <span class="accent-text">Budget</span></h1>
        </div>
      </div>
      <div class="header-right">
        <va-badge
          :text="isOnline ? 'PWA Synchronized' : 'Offline Mode'"
          :color="isOnline ? 'success' : 'warning'"
          class="pwa-badge"
        />
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
                    @click="budgetStore.deleteTransaction(item.id)"
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

.pwa-badge {
  padding: 6px 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
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
