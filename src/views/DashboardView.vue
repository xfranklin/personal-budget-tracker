<template>
  <AppLayout>
    <div class="dashboard-container">
      <div class="header-actions">
        <DatePeriodPicker default-tab="months" @change="onPeriodChange" />
      </div>

      <template v-if="isLoading">
        <div class="loading-state">
          <va-icon name="loop" spin size="large" color="primary" />
          <p>Loading dashboard...</p>
        </div>
      </template>

      <template v-else-if="currentPeriodData.length === 0">
        <div class="empty-state">
          <va-icon name="analytics" size="large" color="textSecondary" />
          <h3>No Data</h3>
          <p>No transactions found for the selected period.</p>
        </div>
      </template>

      <template v-else>
        <!-- Metrics Row -->
        <div class="row metrics-row">
          <!-- Expense -->
          <div class="flex xs12 md4">
            <div class="glass-panel metric-card">
              <div class="metric-info">
                <span class="metric-label">Expenses</span>
                <span class="metric-value text-danger">{{ formatCurrency(metrics.expense) }}</span>
                <span class="metric-trend" :class="getTrendClass(metrics.expenseTrend, true)">
                  <va-icon :name="getTrendIcon(metrics.expenseTrend)" size="small" />
                  {{ formatTrend(metrics.expenseTrend) }} vs last period
                </span>
              </div>
              <div class="metric-icon">
                <va-icon name="arrow_upward" color="#ef4444" size="large" />
              </div>
            </div>
          </div>

          <!-- Income -->
          <div class="flex xs12 md4">
            <div class="glass-panel metric-card">
              <div class="metric-info">
                <span class="metric-label">Income</span>
                <span class="metric-value text-success">{{ formatCurrency(metrics.income) }}</span>
                <span class="metric-trend" :class="getTrendClass(metrics.incomeTrend)">
                  <va-icon :name="getTrendIcon(metrics.incomeTrend)" size="small" />
                  {{ formatTrend(metrics.incomeTrend) }} vs last period
                </span>
              </div>
              <div class="metric-icon">
                <va-icon name="arrow_downward" color="#10b981" size="large" />
              </div>
            </div>
          </div>

          <!-- Net -->
          <div class="flex xs12 md4">
            <div class="glass-panel metric-card">
              <div class="metric-info">
                <span class="metric-label">Difference (Net)</span>
                <span class="metric-value text-primary">{{ formatCurrency(metrics.net) }}</span>
                <span class="metric-trend" :class="getTrendClass(metrics.netTrend)">
                  <va-icon :name="getTrendIcon(metrics.netTrend)" size="small" />
                  {{ formatTrend(metrics.netTrend) }} vs last period
                </span>
              </div>
              <div class="metric-icon">
                <va-icon name="account_balance_wallet" color="#3b82f6" size="large" />
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="row charts-row">
          <div class="flex xs12 md8">
            <div class="glass-panel chart-card">
              <h3>Net Balance Over Time</h3>
              <div class="chart-wrapper">
                <Line v-if="lineChartData" :data="lineChartData" :options="lineOptions" />
              </div>
            </div>
          </div>
          <div class="flex xs12 md4">
            <div class="glass-panel chart-card">
              <h3>Expenses by Category</h3>
              <div class="chart-wrapper">
                <Doughnut v-if="donutChartData" :data="donutChartData" :options="donutOptions" />
              </div>
            </div>
          </div>
        </div>

        <!-- Highlights Row -->
        <div v-if="topExpenses.length > 0" class="row highlights-row">
          <!-- Top 5 Expenses -->
          <div class="flex xs12 md6">
            <div class="glass-panel top-expenses-card">
              <h3 class="top-expenses-title">Top 5 Expenses</h3>
              <div class="top-expenses-list">
                <div v-for="(item, index) in topExpenses" :key="item.id" class="top-expense-item">
                  <div class="expense-rank">#{{ index + 1 }}</div>
                  <div
                    class="expense-cat-icon"
                    :style="{ backgroundColor: item.color + '20', color: item.color }"
                  >
                    <va-icon :name="item.icon" size="small" />
                  </div>
                  <div class="expense-name">{{ item.name }}</div>
                  <div class="expense-amount">{{ formatCurrency(item.amount) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Grouped Transactions -->
          <div class="flex xs12 md6">
            <div class="glass-panel group-expenses-card">
              <div class="group-expenses-header">
                <h3 class="top-expenses-title">By Category Group</h3>
                <div class="group-tabs">
                  <va-button-toggle
                    v-model="activeGroupTab"
                    preset="secondary"
                    border-color="primary"
                    :options="[
                      { label: 'Expenses', value: 'expense' },
                      { label: 'Income', value: 'income' },
                    ]"
                    size="small"
                  />
                </div>
              </div>

              <div v-if="groupedTransactionsList.length > 0" class="group-expenses-list">
                <va-accordion>
                  <va-collapse
                    v-for="g in groupedTransactionsList"
                    :key="g.groupName"
                    class="custom-collapse"
                  >
                    <template #header>
                      <div class="group-collapse-header">
                        <div class="group-header-left">
                          <div
                            class="group-icon"
                            :style="{ backgroundColor: g.color + '20', color: g.color }"
                          >
                            <va-icon :name="g.icon" size="small" />
                          </div>
                          <div class="group-name-container">
                            <span class="group-name">{{ formatGroupName(g.groupName) }}</span>
                            <span class="group-subtitle">{{ g.categories.length }} categories</span>
                          </div>
                        </div>
                        <span
                          class="group-total"
                          :class="activeGroupTab === 'expense' ? 'text-danger' : 'text-success'"
                        >
                          {{ formatCurrency(g.totalAmount) }}
                        </span>
                      </div>
                    </template>
                    <template #content>
                      <div class="group-collapse-body">
                        <div v-for="cat in g.categories" :key="cat.id" class="group-cat-item">
                          <div
                            class="expense-cat-icon"
                            :style="{ backgroundColor: cat.color + '20', color: cat.color }"
                          >
                            <va-icon :name="cat.icon" size="small" />
                          </div>
                          <span class="cat-name">{{ cat.name }}</span>
                          <span class="cat-amount">{{ formatCurrency(cat.amount) }}</span>
                        </div>
                      </div>
                    </template>
                  </va-collapse>
                </va-accordion>
              </div>
              <div v-else class="empty-group-state">
                <p>No {{ activeGroupTab }} records for this period.</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import DatePeriodPicker from '@/components/DatePeriodPicker.vue'
import { useServices } from '@/services'
import { useBudgetStore } from '@/store/budget'
import type { Transaction } from '@/types'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const { transactions: api } = useServices()
const budgetStore = useBudgetStore()

const isLoading = ref(true)
const currentPeriodData = ref<Transaction[]>([])
const previousPeriodData = ref<Transaction[]>([])

const activeGroupTab = ref<'income' | 'expense'>('expense')

// Load Categories
onMounted(async () => {
  const catRes = await api.getCategories()
  if (catRes.success && catRes.data) {
    budgetStore.setCategories(catRes.data)
  }
})

const onPeriodChange = async (payload: {
  startDate: string | null
  endDate: string | null
  label: string
  tab: string
}) => {
  isLoading.value = true

  const { startDate, endDate, tab } = payload

  if (!startDate || !endDate || tab === 'all') {
    // If all time, fetch everything and there is no previous period
    const res = await api.getTransactionsPage({ limit: 10000, offset: 0 })
    if (res.success && res.data) {
      currentPeriodData.value = res.data.items
    } else {
      currentPeriodData.value = []
    }
    previousPeriodData.value = []
    isLoading.value = false
    return
  }

  // Calculate Previous Period Dates
  const curStart = new Date(startDate)
  const curEnd = new Date(endDate)
  let prevStart = new Date(curStart)
  let prevEnd = new Date(curEnd)

  if (tab === 'months') {
    prevStart.setMonth(prevStart.getMonth() - 1)
    prevEnd = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0)
  } else if (tab === 'years') {
    prevStart.setFullYear(prevStart.getFullYear() - 1)
    prevEnd.setFullYear(prevEnd.getFullYear() - 1)
  } else {
    // Custom: subtract diff in days
    const diffTime = Math.abs(curEnd.getTime() - curStart.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    prevStart.setDate(prevStart.getDate() - diffDays)
    prevEnd.setDate(prevEnd.getDate() - diffDays)
  }

  // Fetch both periods
  const [curRes, prevRes] = await Promise.all([
    api.getTransactionsPage({
      startDate: curStart.toISOString().split('T')[0],
      endDate: curEnd.toISOString().split('T')[0],
      limit: 10000,
    }),
    api.getTransactionsPage({
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
      limit: 10000,
    }),
  ])

  currentPeriodData.value = curRes.success && curRes.data ? curRes.data.items : []
  previousPeriodData.value = prevRes.success && prevRes.data ? prevRes.data.items : []

  isLoading.value = false
}

// Formatters
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

const formatTrend = (val: number | null) => {
  if (val === null) return 'N/A'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(1)}%`
}

const getTrendIcon = (val: number | null) => {
  if (val === null) return 'remove'
  if (val > 0) return 'arrow_upward'
  if (val < 0) return 'arrow_downward'
  return 'trending_flat'
}

const getTrendClass = (val: number | null, invertColors = false) => {
  if (val === null || val === 0) return 'text-secondary'
  const isPositive = val > 0
  if (invertColors) {
    return isPositive ? 'text-danger' : 'text-success'
  }
  return isPositive ? 'text-success' : 'text-danger'
}

// Metrics Computation
const metrics = computed(() => {
  const sumType = (data: Transaction[], type: 'income' | 'expense') =>
    data.filter(t => t.type === type).reduce((acc, t) => acc + t.amount, 0)

  const curInc = sumType(currentPeriodData.value, 'income')
  const curExp = sumType(currentPeriodData.value, 'expense')
  const curNet = curInc - curExp

  const prevInc = sumType(previousPeriodData.value, 'income')
  const prevExp = sumType(previousPeriodData.value, 'expense')
  const prevNet = prevInc - prevExp

  const calcTrend = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0
    return ((cur - prev) / Math.abs(prev)) * 100
  }

  return {
    income: curInc,
    expense: curExp,
    net: curNet,
    incomeTrend: previousPeriodData.value.length ? calcTrend(curInc, prevInc) : null,
    expenseTrend: previousPeriodData.value.length ? calcTrend(curExp, prevExp) : null,
    netTrend: previousPeriodData.value.length ? calcTrend(curNet, prevNet) : null,
  }
})

// Format Group Name
const formatGroupName = (name: string) => {
  const map: Record<string, string> = {
    food_drinks: 'Food & Drinks',
    shopping: 'Shopping',
    housing: 'Housing',
    transportation: 'Transportation',
    vehicle: 'Vehicle',
    life_entertainment: 'Life & Entertainment',
    communication_pc: 'Communication & PC',
    financial_expenses: 'Financial Expenses',
    investments_savings: 'Investments & Savings',
    income: 'Income',
    others: 'Others',
  }
  return (
    map[name] ||
    name
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  )
}

// Top 5 Expenses
const topExpenses = computed(() => {
  const expenses = currentPeriodData.value.filter(t => t.type === 'expense')
  if (!expenses.length) return []

  const byCat = expenses.reduce(
    (acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const sorted = Object.entries(byCat)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, 5)

  return sorted.map(([id, amount]) => {
    const cat = budgetStore.categories.find(c => c.id === id)
    return {
      id,
      name: cat ? cat.name : 'Unknown',
      icon: cat ? cat.icon : 'category',
      color: cat ? cat.color : '#a5b0c0',
      amount,
    }
  })
})

// Grouped by Category Group
interface CategorySum {
  id: string
  name: string
  icon: string
  color: string
  amount: number
}

interface GroupSum {
  groupName: string
  type: 'income' | 'expense'
  totalAmount: number
  icon: string
  color: string
  categories: CategorySum[]
}

const groupedTransactionsList = computed(() => {
  const groupsMap = new Map<string, { total: number; categoriesMap: Map<string, CategorySum> }>()

  // Filter by active tab
  const filteredData = currentPeriodData.value.filter(t => t.type === activeGroupTab.value)

  for (const t of filteredData) {
    const cat = budgetStore.categories.find(c => c.id === t.categoryId)
    if (!cat) continue

    const gName = cat.group_name || 'Other'

    if (!groupsMap.has(gName)) {
      groupsMap.set(gName, { total: 0, categoriesMap: new Map() })
    }

    const gState = groupsMap.get(gName)!
    gState.total += t.amount

    if (!gState.categoriesMap.has(cat.id)) {
      gState.categoriesMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: 0,
      })
    }
    const catState = gState.categoriesMap.get(cat.id)!
    catState.amount += t.amount
  }

  const result: GroupSum[] = []
  for (const [gName, val] of groupsMap.entries()) {
    const categoriesArray = Array.from(val.categoriesMap.values()).sort(
      (a, b) => b.amount - a.amount,
    )
    const primaryCat = categoriesArray[0]

    result.push({
      groupName: gName,
      type: activeGroupTab.value,
      totalAmount: val.total,
      icon: primaryCat ? primaryCat.icon : 'folder',
      color: primaryCat ? primaryCat.color : '#a5b0c0',
      categories: categoriesArray,
    })
  }

  return result.sort((a, b) => b.totalAmount - a.totalAmount)
})

// Donut Chart
const donutChartData = computed(() => {
  const expenses = currentPeriodData.value.filter(t => t.type === 'expense')
  const byCat = expenses.reduce(
    (acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const labels: string[] = []
  const data: number[] = []
  const colors: string[] = []

  for (const [id, amount] of Object.entries(byCat)) {
    const cat = budgetStore.categories.find(c => c.id === id)
    labels.push(cat ? cat.name : 'Unknown')
    data.push(amount)
    colors.push(cat?.color || '#a5b0c0')
  }

  if (data.length === 0) return null

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }
})

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const, labels: { color: '#a5b0c0' } },
  },
}

// Line Chart (Cumulative Net Balance)
const lineChartData = computed(() => {
  if (!currentPeriodData.value.length) return null

  // Sort by date ascending
  const sorted = [...currentPeriodData.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Group by day
  const dailyNet: Record<string, number> = {}
  for (const t of sorted) {
    const net = t.type === 'income' ? t.amount : -t.amount
    dailyNet[t.date] = (dailyNet[t.date] || 0) + net
  }

  const dates = Object.keys(dailyNet)
  let cumulative = 0
  const data = dates.map(d => {
    cumulative += dailyNet[d]
    return cumulative
  })

  // Format labels nicely
  const labels = dates.map(d => {
    const date = new Date(d)
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`
  })

  return {
    labels,
    datasets: [
      {
        label: 'Cumulative Balance',
        data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a5b0c0' } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a5b0c0' } },
  },
  plugins: {
    legend: { display: false },
  },
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
  color: var(--text-secondary);

  h3 {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin: 0;
  }
}

/* Equal Horizontal & Vertical Gaps */
.row {
  margin-left: -4px;
  margin-right: -4px;
}

.flex {
  padding: 4px;
}

.metric-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  min-height: 100px;
  border-radius: 12px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.metric-trend {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgb(255 255 255 / 5%);
}

.chart-card {
  padding: 24px;
  border-radius: 16px;
  height: 400px;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 16px;
    font-size: 1.1rem;
    color: var(--text-secondary);
  }
}

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
}

.top-expenses-card {
  padding: 20px;
  border-radius: 12px;
}

.top-expenses-title {
  margin: 0 0 16px;
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.top-expenses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-expense-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgb(255 255 255 / 5%);

  &:last-child {
    border-bottom: none;
  }
}

.expense-rank {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  width: 24px;
}

.expense-cat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.expense-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.expense-amount {
  font-weight: 600;
  color: #ef4444;
}

.group-expenses-card {
  padding: 20px;
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.group-expenses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
  }
}

.group-expenses-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-collapse {
  background: rgb(255 255 255 / 2%);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgb(255 255 255 / 5%);
}

.group-collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  cursor: pointer;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.group-name-container {
  display: flex;
  flex-direction: column;
}

.group-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.group-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.group-total {
  font-weight: 700;
  margin-right: 8px;
  font-size: 1.05rem;
}

.group-collapse-body {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-cat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px dashed rgb(255 255 255 / 10%);

  &:first-child {
    border-top: none;
    padding-top: 0;
  }
}

.cat-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.cat-amount {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.empty-group-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
  padding: 24px;
}

.text-success {
  color: #10b981;
}
.text-danger {
  color: #ef4444;
}
.text-primary {
  color: #3b82f6;
}
.text-secondary {
  color: #a5b0c0;
}

@media (width <= 768px) {
  .metric-card {
    padding: 12px 16px;
    min-height: auto;
  }

  .metric-info {
    gap: 4px;
  }

  .metric-label {
    font-size: 0.75rem;
  }

  .metric-value {
    font-size: 1.25rem;
  }

  .metric-trend {
    font-size: 0.75rem;
  }

  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    :deep(i) {
      font-size: 20px !important;
    }
  }

  .chart-card {
    height: 300px;
  }
}
</style>
