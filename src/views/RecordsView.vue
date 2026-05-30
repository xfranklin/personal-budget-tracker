<template>
  <AppLayout>
    <div class="records-container">
      <!-- Date Period Picker at the Top -->
      <div class="row header-row">
        <div class="flex xs12">
          <DatePeriodPicker default-tab="years" @change="onPeriodChange" />
        </div>
      </div>

      <!-- Transactions List Workspace -->
      <div class="row content-row">
        <div class="flex xs12">
          <div class="glass-panel section-card">
            <div class="section-header">
              <div class="section-title">
                <va-icon name="receipt_long" size="medium" />
                <h2>Records ({{ loadedTransactions.length }} / {{ periodSummary.totalCount }})</h2>
                <va-button
                  v-if="periodSummary.totalCount > 0"
                  preset="secondary"
                  icon="delete"
                  color="danger"
                  size="small"
                  class="ml-auto"
                  @click="showDeleteAllModal = true"
                >
                  Delete All
                </va-button>
              </div>
              <div class="summary-badges">
                <span class="badge-total badge-total-expense">
                  {{ formatCurrency(periodSummary.totalExpense) }} Spent
                </span>
                <span class="badge-total badge-total-income">
                  {{ formatCurrency(periodSummary.totalIncome) }} Income
                </span>
                <span class="badge-total">{{ formatCurrency(totalPeriodSum) }} Net</span>
              </div>
            </div>

            <!-- Transaction Rows List -->
            <div class="transactions-list">
              <TransitionGroup name="list" tag="div" class="transactions-stack">
                <template v-for="group in groupedTransactions" :key="group.date">
                  <div class="date-group-header">
                    <span>{{ formatDateHeader(group.date) }}</span>
                  </div>
                  <TransactionRow
                    v-for="item in group.transactions"
                    :key="item.id"
                    :item="item"
                    @edit="openEditModal(item)"
                    @delete="openDeleteModal(item)"
                    @mobile-click="openEditModal(item)"
                  />
                </template>
              </TransitionGroup>

              <div v-if="isLoadingRecords" class="load-state">
                <va-icon name="progress_activity" spin size="medium" color="primary" />
                <span>Loading records...</span>
              </div>

              <va-button
                v-if="hasMoreRecords && !isLoadingRecords"
                preset="secondary"
                icon="expand_more"
                class="load-more-button"
                @click="loadNextTransactionsPage"
              >
                Load 25 more
              </va-button>

              <!-- Empty State -->
              <div
                v-if="!isLoadingRecords && loadedTransactions.length === 0"
                class="empty-state pulse-animation"
              >
                <va-icon name="subtitles_off" size="large" color="textSecondary" />
                <p>No records found for the selected period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Transaction Modal -->
    <va-modal
      v-model="showEditModal"
      hide-default-actions
      no-outside-dismiss
      z-index="9999"
      attach-element="body"
      class="edit-transaction-modal"
    >
      <div class="modal-form-container">
        <div class="modal-form-header">
          <div class="modal-form-title">
            <va-icon name="edit" size="medium" color="primary" />
            <h3>Edit Entry</h3>
          </div>
          <va-button
            preset="plain"
            icon="close"
            color="textSecondary"
            size="medium"
            @click="showEditModal = false"
          />
        </div>

        <form v-if="editForm" class="transaction-form" @submit.prevent="handleEditSubmit">
          <!-- Type Selector -->
          <div class="form-group type-selector">
            <va-button-toggle
              v-model="editForm.type"
              :options="[
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' },
              ]"
              color="primary"
              class="w-full"
              @update:model-value="onEditTypeChange"
            />
          </div>

          <!-- Amount Input -->
          <div class="form-group">
            <label class="form-label">Amount ($)</label>
            <div class="amount-input-wrapper">
              <va-icon name="attach_money" color="textSecondary" class="amount-icon" />
              <input
                v-model.number="editForm.amount"
                type="number"
                inputmode="decimal"
                step="any"
                min="0"
                placeholder="0.00"
                class="amount-native-input"
                required
              />
            </div>
          </div>

          <!-- Category Selector -->
          <div class="form-group">
            <CategoryPicker
              v-model="editForm.categoryId"
              :categories="budgetStore.categories"
              :type="editForm.type"
            />
          </div>

          <!-- Date Selector -->
          <div class="form-group">
            <label class="form-label">Date</label>
            <va-input v-model="editForm.date" type="date" required outline class="w-full">
              <template #prependInner>
                <va-icon name="calendar_today" color="textSecondary" />
              </template>
            </va-input>
          </div>

          <!-- Description Input -->
          <div class="form-group">
            <label class="form-label">Description (Optional)</label>
            <va-input
              v-model="editForm.description"
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
            icon="save"
            :loading="isSubmitting"
            :disabled="!editForm.amount || editForm.amount <= 0 || !editForm.categoryId"
          >
            Save Changes
          </va-button>

          <!-- Delete Button directly in Edit Modal -->
          <va-button
            type="button"
            preset="secondary"
            color="danger"
            class="w-full"
            icon="delete"
            @click="openDeleteModalFromEdit"
          >
            Delete Entry
          </va-button>
        </form>
      </div>
    </va-modal>

    <!-- Delete Confirmation Modal -->
    <va-modal
      v-model="showDeleteModal"
      hide-default-actions
      no-outside-dismiss
      z-index="9999"
      attach-element="body"
      class="delete-confirm-modal"
    >
      <div class="modal-form-container">
        <div class="modal-form-header">
          <div class="modal-form-title">
            <va-icon name="warning" size="medium" color="danger" />
            <h3>Delete Entry</h3>
          </div>
          <va-button
            preset="plain"
            icon="close"
            color="textSecondary"
            size="medium"
            :disabled="isDeleting"
            aria-label="Close delete confirmation"
            @click="closeDeleteModal"
          />
        </div>

        <div v-if="transactionToDelete" class="delete-content">
          <p>
            Are you sure you want to delete
            <strong>"{{ transactionDeleteTitle }}"</strong>
            for <strong>{{ formatCurrency(transactionToDelete.amount) }}</strong
            >? This action cannot be undone.
          </p>

          <div class="delete-actions">
            <va-button preset="secondary" :disabled="isDeleting" @click="closeDeleteModal">
              Cancel
            </va-button>
            <va-button
              color="danger"
              icon="delete"
              :loading="isDeleting"
              @click="handleDeleteSubmit"
            >
              Delete
            </va-button>
          </div>
        </div>
      </div>
    </va-modal>

    <!-- Delete All Confirmation Modal -->
    <va-modal
      v-model="showDeleteAllModal"
      hide-default-actions
      no-outside-dismiss
      z-index="9999"
      attach-element="body"
      class="delete-confirm-modal"
    >
      <div class="modal-form-container">
        <div class="modal-form-header">
          <div class="modal-form-title">
            <va-icon name="warning" size="medium" color="danger" />
            <h3>Delete All Records</h3>
          </div>
          <va-button
            preset="plain"
            icon="close"
            color="textSecondary"
            size="medium"
            :disabled="isDeletingAll"
            @click="showDeleteAllModal = false"
          />
        </div>

        <div class="delete-content">
          <p>
            Are you sure you want to delete <strong>all records</strong> in this period? This action
            will permanently delete <strong>{{ periodSummary.totalCount }}</strong> records and
            cannot be undone.
          </p>

          <div class="delete-actions">
            <va-button
              preset="secondary"
              :disabled="isDeletingAll"
              @click="showDeleteAllModal = false"
            >
              Cancel
            </va-button>
            <va-button
              color="danger"
              icon="delete_sweep"
              :loading="isDeletingAll"
              @click="handleDeleteAllSubmit"
            >
              Delete All
            </va-button>
          </div>
        </div>
      </div>
    </va-modal>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBudgetStore } from '@/store/budget'
import { useServices } from '@/services'
import type { TransactionType, Transaction, Category } from '@/types'
import AppLayout from '@/components/AppLayout.vue'
import DatePeriodPicker from '@/components/DatePeriodPicker.vue'
import TransactionRow from '@/components/TransactionRow.vue'
import CategoryPicker from '@/components/CategoryPicker.vue'

const budgetStore = useBudgetStore()
const { transactions } = useServices()
const PAGE_SIZE = 25

// Current Selected Period State
const currentPeriod = ref<{ startDate: string | null; endDate: string | null; label: string }>({
  startDate: null,
  endDate: null,
  label: 'All time records',
})
const loadedTransactions = ref<Transaction[]>([])
const isLoadingRecords = ref(false)
const pageOffset = ref(0)
const periodSummary = ref({
  totalCount: 0,
  totalIncome: 0,
  totalExpense: 0,
})

const onPeriodChange = (payload: {
  startDate: string | null
  endDate: string | null
  label: string
}) => {
  currentPeriod.value = payload
  resetAndLoadTransactions()
}

const loadedTransactionsWithCategory = computed(() => {
  return loadedTransactions.value.map(t => ({
    ...t,
    category: budgetStore.categories.find(c => c.id === t.categoryId),
  }))
})

const groupedTransactions = computed(() => {
  const groups: Record<string, typeof loadedTransactionsWithCategory.value> = {}

  for (const tx of loadedTransactionsWithCategory.value) {
    const dateStr = tx.date
    if (!groups[dateStr]) {
      groups[dateStr] = []
    }
    groups[dateStr].push(tx)
  }

  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      date,
      transactions: groups[date],
    }))
})

const formatDateHeader = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateObjStr = date.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (dateObjStr === todayStr) return 'Today'
  if (dateObjStr === yesterdayStr) return 'Yesterday'

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(date)
}

// Net Sum for filtered period (Income - Expense)
const totalPeriodSum = computed(() => {
  return periodSummary.value.totalIncome - periodSummary.value.totalExpense
})

const hasMoreRecords = computed(
  () => loadedTransactions.value.length < periodSummary.value.totalCount,
)

// Edit Form Modal State
const showEditModal = ref(false)
const isSubmitting = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const transactionToDelete = ref<(Transaction & { category?: Category }) | null>(null)
const editForm = ref<{
  id: string
  amount: number | null
  type: TransactionType
  categoryId: string
  date: string
  description: string
} | null>(null)

// Computed categories list for edit form
const filteredEditCategories = computed(() => {
  if (!editForm.value) return []
  return budgetStore.categories.filter(c => c.type === editForm.value!.type)
})

// On Type change inside edit form
const onEditTypeChange = () => {
  if (!editForm.value) return
  const cats = filteredEditCategories.value
  editForm.value.categoryId = cats.length > 0 ? cats[0].id : ''
}

// Open modal and pre-fill form
const openEditModal = (item: Transaction) => {
  editForm.value = {
    id: item.id,
    amount: item.amount,
    type: item.type,
    categoryId: item.categoryId,
    date: item.date,
    description: item.description || '',
  }
  showEditModal.value = true
}

const transactionDeleteTitle = computed(() => {
  if (!transactionToDelete.value) return ''
  return (
    transactionToDelete.value.description ||
    transactionToDelete.value.category?.name ||
    'this entry'
  )
})

const openDeleteModal = (item: Transaction & { category?: Category }) => {
  transactionToDelete.value = item
  showDeleteModal.value = true
}

const openDeleteModalFromEdit = () => {
  if (editForm.value) {
    const tx = loadedTransactionsWithCategory.value.find(t => t.id === editForm.value!.id)
    if (tx) {
      showEditModal.value = false
      openDeleteModal(tx)
    }
  }
}

const closeDeleteModal = () => {
  if (isDeleting.value) return
  showDeleteModal.value = false
  transactionToDelete.value = null
}

const loadCategories = async () => {
  try {
    const response = await transactions.getCategories()
    if (response.success && response.data) {
      budgetStore.setCategories(response.data)
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const loadTransactionsPage = async (append = false) => {
  if (isLoadingRecords.value) return

  isLoadingRecords.value = true

  try {
    const response = await transactions.getTransactionsPage({
      startDate: currentPeriod.value.startDate,
      endDate: currentPeriod.value.endDate,
      limit: PAGE_SIZE,
      offset: append ? pageOffset.value : 0,
    })

    if (response.success && response.data) {
      loadedTransactions.value = append
        ? [...loadedTransactions.value, ...response.data.items]
        : response.data.items
      pageOffset.value = loadedTransactions.value.length
      periodSummary.value = {
        totalCount: response.data.totalCount,
        totalIncome: response.data.totalIncome,
        totalExpense: response.data.totalExpense,
      }
    }
  } catch (err) {
    console.error('Failed to load transactions page:', err)
  } finally {
    isLoadingRecords.value = false
  }
}

const resetAndLoadTransactions = async () => {
  loadedTransactions.value = []
  pageOffset.value = 0
  periodSummary.value = {
    totalCount: 0,
    totalIncome: 0,
    totalExpense: 0,
  }
  await loadTransactionsPage(false)
}

const loadNextTransactionsPage = () => {
  if (!hasMoreRecords.value) return
  loadTransactionsPage(true)
}

const onWindowScroll = () => {
  const distanceFromBottom =
    document.documentElement.scrollHeight - window.scrollY - window.innerHeight

  if (distanceFromBottom < 120) {
    loadNextTransactionsPage()
  }
}

onMounted(() => {
  loadCategories()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

// Form edit submission
const handleEditSubmit = async () => {
  if (
    !editForm.value ||
    !editForm.value.amount ||
    editForm.value.amount <= 0 ||
    !editForm.value.categoryId
  )
    return

  isSubmitting.value = true
  const payload = {
    amount: editForm.value.amount,
    type: editForm.value.type,
    categoryId: editForm.value.categoryId,
    date: editForm.value.date,
    description: editForm.value.description || undefined,
  }

  try {
    const response = await transactions.updateTransaction(editForm.value.id, payload)
    if (response.success) {
      showEditModal.value = false
      await resetAndLoadTransactions()
    } else {
      console.error('Failed to update transaction:', response.error)
    }
  } catch (err) {
    console.error('Failed to persist transaction update:', err)
  } finally {
    isSubmitting.value = false
  }
}

// Delete transaction
const handleDeleteSubmit = async () => {
  if (!transactionToDelete.value) return

  const id = transactionToDelete.value.id
  isDeleting.value = true

  try {
    const response = await transactions.deleteTransaction(id)

    if (response.success) {
      showDeleteModal.value = false
      transactionToDelete.value = null
      await resetAndLoadTransactions()
    } else {
      console.error('Failed to delete transaction:', response.error)
    }
  } catch (err) {
    console.error('Failed to delete transaction:', err)
  } finally {
    isDeleting.value = false
  }
}

// Delete all transactions in period
const showDeleteAllModal = ref(false)
const isDeletingAll = ref(false)

const handleDeleteAllSubmit = async () => {
  if (periodSummary.value.totalCount === 0) return

  isDeletingAll.value = true
  try {
    let start = currentPeriod.value.startDate
    let end = currentPeriod.value.endDate

    // If 'All time' is selected, use a massive date range
    if (!start || !end) {
      start = '1970-01-01'
      end = '2100-12-31'
    }

    const response = await transactions.deleteTransactionsByPeriod(start, end)

    if (!response.success) {
      console.error('Failed to delete bulk transactions:', response.error)
    }

    showDeleteAllModal.value = false
    await resetAndLoadTransactions()
  } catch (err) {
    console.error('Failed to delete all transactions:', err)
  } finally {
    isDeletingAll.value = false
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}
</script>

<style lang="scss" scoped>
.records-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
}

.header-row {
  margin-bottom: 8px;
  position: relative;
  z-index: 20;
  overflow: visible;
}

.content-row {
  gap: 24px 0;
  position: relative;
  z-index: 1;
}

.section-card {
  padding: 24px;
  min-height: calc(100vh - 132px);
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }
}

.badge-total {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary);
  background: rgb(21 78 193 / 8%);
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.summary-badges {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.badge-total-expense {
  color: #d92d3a;
  background: rgb(229 72 77 / 10%);
}

.badge-total-income {
  color: #00875f;
  background: rgb(0 168 120 / 10%);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding-right: 4px;
}

.transactions-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-group-header {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-left: 4px;
}

.load-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.load-more-button {
  align-self: center;
  margin: 18px auto 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  text-align: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-secondary);

  p {
    font-size: 0.95rem;
    max-width: 320px;
  }
}

/* Modal Form Styles */
.modal-form-container {
  padding: 4px;
}

.modal-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 16px;
}

.modal-form-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
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
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.w-full {
  width: 100%;
}

.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  .amount-icon {
    position: absolute;
    left: 12px;
    pointer-events: none;
  }

  .amount-native-input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border-radius: 8px;
    border: 1px solid var(--glass-border);
    background: transparent;
    color: var(--text-primary);
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
    }

    &:hover {
      border-color: var(--primary);
    }

    &:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgb(21 78 193 / 12%);
    }

    &[type='number'] {
      appearance: textfield;
    }
  }
}

.submit-button {
  margin-top: 8px;
  padding: 10px 0;
}

.delete-content {
  display: flex;
  flex-direction: column;
  gap: 20px;

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  strong {
    color: var(--text-primary);
  }
}

.delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

@media (width <= 640px) {
  .records-container {
    padding: 16px 8px;
  }

  .section-card {
    padding: 16px 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .section-title h2 {
    font-size: 1.1rem;
  }

  .summary-badges {
    width: 100%;
    justify-content: flex-start;
    gap: 6px;
  }

  .badge-total {
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 6px;
  }
}
</style>
