<template>
  <div class="app-layout" :class="{ 'layout-has-sidebar': isSidebarVisible }">
    <!-- ===================== SIDEBAR (≥ 1024px) ===================== -->
    <aside v-if="isSidebarVisible" class="sidebar glass-panel">
      <!-- Brand -->
      <div class="sidebar-brand">
        <va-icon name="payments" color="primary" size="large" />
        <span class="sidebar-brand-text">
          AntiGravity <strong class="sidebar-accent">Budget</strong>
        </span>
      </div>

      <!-- Nav links -->
      <nav class="sidebar-nav">
        <a
          v-for="item in navItems"
          :key="item.label"
          class="sidebar-nav-item"
          :class="{ active: item.active }"
          href="#"
          @click.prevent="item.action"
        >
          <va-icon :name="item.icon" size="medium" />
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <!-- Spacer -->
      <div class="sidebar-spacer" />

      <!-- Add Action CTA (Moved below main menu, pushed to the bottom) -->
      <div class="sidebar-action-container">
        <va-button
          color="primary"
          icon="add"
          class="w-full sidebar-action-btn"
          @click="budgetStore.showAddTransactionModal = true"
        >
          Add Entry
        </va-button>
      </div>

      <!-- Footer controls -->
      <div class="sidebar-footer">
        <div class="pwa-status" :class="isOnline ? 'online' : 'offline'">
          <span class="pwa-dot" />
          <span>{{ isOnline ? 'Synchronized' : 'Offline' }}</span>
        </div>

        <button
          class="sidebar-ctrl-btn"
          :title="theme === 'light' ? 'Switch to dark' : 'Switch to light'"
          @click="toggleTheme"
        >
          <va-icon :name="theme === 'light' ? 'dark_mode' : 'light_mode'" size="small" />
          <span>{{ theme === 'light' ? 'Dark' : 'Light' }}</span>
        </button>

        <button class="sidebar-ctrl-btn danger" title="Lock / Logout" @click="handleLogout">
          <va-icon name="logout" size="small" />
          <span>Lock</span>
        </button>
      </div>
    </aside>

    <!-- ===================== MAIN CONTENT ===================== -->
    <main class="layout-main">
      <slot />
    </main>

    <!-- ===================== BOTTOM BAR (< 1024px) ===================== -->
    <nav v-if="!isSidebarVisible" class="bottom-bar glass-panel">
      <!-- First 3 nav items -->
      <a
        v-for="item in navItems.slice(0, 3)"
        :key="item.label"
        class="bottom-bar-item"
        :class="{ active: item.active }"
        href="#"
        @click.prevent="item.action"
      >
        <va-icon :name="item.icon" size="small" />
        <span>{{ item.label }}</span>
      </a>

      <!-- Circular Highlighted Add Button on Mobile -->
      <button
        class="bottom-bar-item mobile-add-btn"
        @click="budgetStore.showAddTransactionModal = true"
      >
        <div class="mobile-add-btn-icon-wrapper">
          <va-icon name="add" size="small" />
        </div>
        <span>Add</span>
      </button>

      <!-- More Dropdown -->
      <va-dropdown placement="top-end" :offset="[0, 16]" class="mobile-more-dropdown">
        <template #anchor>
          <button class="bottom-bar-item">
            <va-icon name="more_horiz" size="small" />
            <span>More</span>
          </button>
        </template>

        <div class="mobile-more-menu glass-panel">
          <a
            v-for="item in navItems.slice(3)"
            :key="item.label"
            class="mobile-more-item"
            :class="{ active: item.active }"
            href="#"
            @click.prevent="item.action"
          >
            <va-icon :name="item.icon" size="small" />
            <span>{{ item.label }}</span>
          </a>

          <div class="mobile-more-divider" />

          <button class="mobile-more-item" @click="toggleTheme">
            <va-icon :name="theme === 'light' ? 'dark_mode' : 'light_mode'" size="small" />
            <span>{{ theme === 'light' ? 'Dark Mode' : 'Light Mode' }}</span>
          </button>

          <button class="mobile-more-item danger" @click="handleLogout">
            <va-icon name="logout" size="small" />
            <span>Lock</span>
          </button>
        </div>
      </va-dropdown>
    </nav>
  </div>

  <!-- Global Add Transaction Modal -->
  <va-modal
    v-model="budgetStore.showAddTransactionModal"
    hide-default-actions
    no-outside-dismiss
    z-index="9999"
    attach-element="body"
    class="add-transaction-modal"
  >
    <div class="modal-form-container">
      <div class="modal-form-header">
        <div class="modal-form-title">
          <va-icon name="add_circle" size="medium" color="primary" />
          <h3>Add Entry</h3>
        </div>
        <va-button
          preset="plain"
          icon="close"
          color="textSecondary"
          size="medium"
          @click="budgetStore.showAddTransactionModal = false"
        />
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
          <div class="amount-input-wrapper">
            <va-icon name="attach_money" color="textSecondary" class="amount-icon" />
            <input
              v-model.number="amount"
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
          <CategoryPicker v-model="categoryId" :categories="budgetStore.categories" :type="type" />
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
  </va-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBudgetStore } from '@/store/budget'
import { useTheme } from '@/composables/useTheme'
import { useServices } from '@/services'
import type { TransactionType, Transaction } from '@/types'
import CategoryPicker from '@/components/CategoryPicker.vue'

const router = useRouter()
const route = useRoute()
const budgetStore = useBudgetStore()
const { theme, toggleTheme } = useTheme()
const { transactions } = useServices()

// Responsive: sidebar only ≥ 1024 px
const windowWidth = ref(window.innerWidth)
const isSidebarVisible = computed(() => windowWidth.value >= 1024)

const onResize = () => {
  windowWidth.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// Online status
const isOnline = ref(navigator.onLine)
const setOnline = () => {
  isOnline.value = true
}
const setOffline = () => {
  isOnline.value = false
}
onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOffline)
})
onUnmounted(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOffline)
})

// Logout
const handleLogout = () => {
  localStorage.removeItem('auth_token')
  budgetStore.setTransactions([])
  budgetStore.setCategories([])
  router.push({ name: 'login' })
}

// Navigation items
const navItems = computed(() => [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    active: route.name === 'dashboard',
    action: () => router.push({ name: 'dashboard' }),
  },
  {
    label: 'Records',
    icon: 'receipt_long',
    active: route.name === 'records',
    action: () => router.push({ name: 'records' }),
  },
  {
    label: 'Categories',
    icon: 'category',
    active: route.name === 'categories',
    action: () => router.push({ name: 'categories' }),
  },
  {
    label: 'Import',
    icon: 'sync_alt',
    active: route.name === 'data-transfer',
    action: () => router.push({ name: 'data-transfer' }),
  },
])

// ================= GLOBAL ADD ENTRY FORM LOGIC =================
const amount = ref<number | null>(null)
const type = ref<TransactionType>('expense')
const categoryId = ref<string>('')
const date = ref<string>(new Date().toISOString().split('T')[0])
const description = ref<string>('')

// Filter categories
const filteredCategories = computed(() => {
  return budgetStore.categories.filter(c => c.type === type.value)
})

const loadCategories = async () => {
  try {
    const response = await transactions.getCategories()
    if (response.success && response.data) {
      budgetStore.setCategories(response.data)
    }
  } catch (err) {
    console.error('Failed to load categories for Add Entry:', err)
  }
}

// Set initial category when type changes
const onTypeChange = () => {
  const cats = filteredCategories.value
  categoryId.value = cats.length > 0 ? cats[0].id : ''
}

// Watch type change to auto-update categories selector
watch(type, onTypeChange)

// Trigger category select when categories list updates
watch(() => budgetStore.categories, onTypeChange, { immediate: true })
watch(
  () => budgetStore.showAddTransactionModal,
  isOpen => {
    if (isOpen) {
      loadCategories()
    }
  },
)

onMounted(() => {
  loadCategories()
})

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
    if (response.success && response.data) {
      const newTx: Transaction = {
        ...payload,
        id: response.data.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      budgetStore.appendTransaction(newTx)
    } else {
      console.error('Failed to save transaction:', response.error)
    }
  } catch (err) {
    console.error('Failed to persist transaction:', err)
  } finally {
    isSubmitting.value = false
    amount.value = null
    description.value = ''
    budgetStore.showAddTransactionModal = false
  }
}
</script>

<style lang="scss" scoped>
/* ─── Layout skeleton ─────────────────────────────────────────── */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.layout-main {
  flex: 1;
  min-width: 0;

  /* bottom padding on mobile so content is not hidden behind bottom bar */
  padding-bottom: 72px;

  @media (width >= 1024px) {
    margin-left: 240px;
    padding-bottom: 0;
  }
}

/* ─── Sidebar ─────────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  border-radius: 0;
  border-right: 1px solid var(--glass-border);
  border-top: none;
  border-bottom: none;
  border-left: none;
  box-shadow: 2px 0 16px rgb(0 0 0 / 4%);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
  z-index: 100;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 24px;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 16px;
}

.sidebar-brand-text {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--text-primary);
}

.sidebar-accent {
  color: var(--primary);
  font-weight: 800;
}

.sidebar-action-container {
  padding: 0;
  margin-top: 16px;
  margin-bottom: 16px;
  border-top: none;
}

.sidebar-action-btn {
  width: 100%;

  --va-button-font-weight: 600;

  box-shadow: none;
}

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background 0.18s ease,
    color 0.18s ease;

  &:hover {
    background: rgb(21 78 193 / 8%);
    color: var(--primary);
  }

  &.active {
    background: rgb(21 78 193 / 12%);
    color: var(--primary);
    font-weight: 600;
  }
}

/* Spacer */
.sidebar-spacer {
  flex: 1;
}

/* Footer */
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.pwa-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--text-secondary);

  &.online {
    color: #22c55e;
  }

  &.offline {
    color: #f59e0b;
  }
}

.pwa-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentcolor;
  flex-shrink: 0;
}

.sidebar-ctrl-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition:
    background 0.18s ease,
    color 0.18s ease;
  font-family: inherit;

  &:hover {
    background: rgb(21 78 193 / 8%);
    color: var(--primary);
  }

  &.danger:hover {
    background: rgb(239 68 68 / 8%);
    color: #ef4444;
  }
}

/* ─── Bottom bar ──────────────────────────────────────────────── */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  border-radius: 0;
  border-bottom: none;
  border-left: none;
  border-right: none;
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -4px 24px rgb(0 0 0 / 6%);
  z-index: 200;
}

.bottom-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.18s ease;
  font-family: inherit;

  &:hover,
  &.active {
    color: var(--primary);
  }

  &.danger:hover {
    color: #ef4444;
  }
}

.mobile-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;

  .mobile-add-btn-icon-wrapper {
    background: var(--primary);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 10px rgb(21 78 193 / 30%);
    margin-bottom: -1px;
  }
}

.mobile-more-dropdown {
  display: flex;
}

.mobile-more-menu {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 8px 0;
  border-radius: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 20px rgb(0 0 0 / 10%);
}

.mobile-more-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover,
  &.active {
    background: rgb(21 78 193 / 5%);
    color: var(--primary);
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: rgb(239 68 68 / 5%);
    }
  }
}

.mobile-more-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 4px 0;
}

/* ─── Global modal form styles ────────────────────────────────── */
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

.animate-select {
  transition: all 0.2s ease;
}
</style>
