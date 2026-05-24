<template>
  <AppLayout>
    <div class="dashboard-container">
      <!-- Metrics Row -->
      <div class="row metrics-row">
        <!-- Income Metric Card -->
        <div class="flex xs12 md4">
          <div class="glass-panel metric-card glowing-border">
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

        <!-- Expense Metric Card -->
        <div class="flex xs12 md4">
          <div class="glass-panel metric-card glowing-border">
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

        <!-- Net Balance Metric Card -->
        <div class="flex xs12 md4">
          <div class="glass-panel metric-card glowing-border">
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
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBudgetStore } from '@/store/budget'
import { useServices } from '@/services'
import AppLayout from '@/components/AppLayout.vue'

const budgetStore = useBudgetStore()
const { transactions } = useServices()

// Fetch transactions and categories on mount
const loadData = async () => {
  try {
    const [txRes, catRes] = await Promise.all([
      transactions.getTransactions(),
      transactions.getCategories(),
    ])

    if (txRes.success && txRes.data) {
      budgetStore.setTransactions(txRes.data)
    } else {
      budgetStore.setTransactions([])
    }

    if (catRes.success && catRes.data) {
      budgetStore.setCategories(catRes.data)
    } else {
      budgetStore.setCategories([])
    }
  } catch (err) {
    console.error('API services loaded with error:', err)
    budgetStore.setTransactions([])
    budgetStore.setCategories([])
  }
}

onMounted(() => {
  loadData()
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
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
</style>
