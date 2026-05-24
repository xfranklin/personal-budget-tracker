<template>
  <AppLayout>
    <div class="categories-container">
      <div class="row header-row">
        <div class="flex xs12 col-header">
          <div class="glass-panel main-header-panel">
            <div class="header-left">
              <va-icon name="category" size="large" color="primary" />
              <h2>Categories Management</h2>
            </div>

            <div class="header-actions">
              <va-button-toggle
                v-model="currentType"
                :options="[
                  { label: 'Expenses', value: 'expense' },
                  { label: 'Incomes', value: 'income' },
                ]"
                color="primary"
                class="type-toggle"
              />
              <va-button color="primary" icon="add" class="add-btn" @click="openAddModal">
                Create Category
              </va-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Grouped Categories List -->
      <div class="groups-list">
        <div v-for="group in groupedCategories" :key="group.id" class="group-section">
          <!-- Group Header -->
          <div class="group-header" :style="{ '--group-color': group.color }">
            <div class="group-header-badge" :style="{ backgroundColor: group.color }">
              <va-icon :name="group.icon" color="#fff" size="small" />
            </div>
            <h3 class="group-header-title">
              {{ group.name }}
              <span class="group-count-badge">{{ group.categories.length }}</span>
            </h3>
            <div class="group-header-line" />
          </div>

          <!-- Group Categories Grid -->
          <div class="row grid-row">
            <div
              v-for="cat in group.categories"
              :key="cat.id"
              class="flex xs12 sm6 md4 lg3 col-card animate-card"
            >
              <div class="glass-panel category-card" :style="{ '--cat-color': cat.color }">
                <div class="card-icon-wrapper" :style="{ backgroundColor: cat.color }">
                  <va-icon :name="cat.icon" color="#fff" size="medium" />
                </div>

                <div class="card-info">
                  <span class="card-name" :title="cat.name">{{ cat.name }}</span>
                  <span v-if="cat.is_default" class="default-badge">System</span>
                  <span v-else class="custom-badge">Custom</span>
                </div>

                <!-- Action buttons: hidden/disabled for system default categories -->
                <div class="card-actions">
                  <template v-if="!cat.is_default">
                    <button
                      class="action-btn action-btn--edit"
                      title="Edit Category"
                      type="button"
                      @click="openEditModal(cat)"
                    >
                      <va-icon name="edit" size="small" />
                    </button>
                    <button
                      class="action-btn action-btn--delete"
                      title="Delete Category"
                      type="button"
                      @click="confirmDelete(cat)"
                    >
                      <va-icon name="delete" size="small" />
                    </button>
                  </template>
                  <template v-else>
                    <span class="lock-badge" title="System default (Locked)">
                      <va-icon name="lock" size="small" />
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="groupedCategories.length === 0" class="empty-state pulse-animation">
          <va-icon name="category" size="large" color="textSecondary" />
          <p>No categories found. Create a custom category to get started!</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <va-modal
      v-model="showFormModal"
      hide-default-actions
      z-index="9999"
      attach-element="body"
      class="category-form-modal"
    >
      <div class="modal-form-container">
        <div class="modal-form-header">
          <div class="modal-form-title">
            <va-icon :name="isEditing ? 'edit' : 'add_circle'" size="medium" color="primary" />
            <h3>{{ isEditing ? 'Edit Category' : 'Create Category' }}</h3>
          </div>
          <va-button
            preset="plain"
            icon="close"
            color="textSecondary"
            size="medium"
            @click="closeFormModal"
          />
        </div>

        <form class="category-form" @submit.prevent="handleFormSubmit">
          <!-- Type Selector -->
          <div class="form-group">
            <label class="form-label">Type</label>
            <va-button-toggle
              v-model="form.type"
              :options="[
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' },
              ]"
              color="primary"
              class="w-full"
              :disabled="isEditing"
              @update:model-value="onFormTypeChange"
            />
          </div>

          <!-- Name Input -->
          <div class="form-group">
            <label class="form-label">Category Name</label>
            <va-input
              v-model="form.name"
              placeholder="e.g. Subscriptions, Gifts"
              required
              outline
              class="w-full"
            />
          </div>

          <!-- Group Selection -->
          <div class="form-group">
            <div class="form-label-with-color">
              <label class="form-label">Group</label>
              <div
                v-if="selectedGroupColor"
                class="group-color-pill-preview"
                :style="{ backgroundColor: selectedGroupColor }"
                title="Group Color Indicator"
              />
            </div>

            <select v-model="form.group_name" class="native-group-select" required>
              <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>

            <span v-if="selectedGroupColor" class="group-help-text">
              * Category will inherit this group's premium color.
            </span>
          </div>

          <!-- Visual Icon Selection Pool -->
          <div class="form-group">
            <label class="form-label">Choose Icon</label>
            <div class="icon-grid">
              <button
                v-for="icon in iconPool"
                :key="icon"
                type="button"
                class="icon-select-btn"
                :class="{ active: form.icon === icon }"
                @click="form.icon = icon"
              >
                <va-icon :name="icon" size="small" />
              </button>
            </div>
          </div>

          <!-- Error Alert inside Form -->
          <div v-if="formError" class="form-error-panel">
            <va-icon name="warning" color="danger" size="small" />
            <span>{{ formError }}</span>
          </div>

          <!-- Submit Button -->
          <va-button
            type="submit"
            color="primary"
            class="w-full submit-button"
            icon="check"
            :loading="isSubmitting"
            :disabled="!form.name || !form.icon || !form.group_name"
          >
            {{ isEditing ? 'Save Changes' : 'Create Category' }}
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
            <h3>Delete Category</h3>
          </div>
          <va-button
            preset="plain"
            icon="close"
            color="textSecondary"
            size="medium"
            @click="closeDeleteModal"
          />
        </div>

        <div class="delete-content">
          <p>
            Are you sure you want to delete the custom category
            <strong>"{{ categoryToDelete?.name }}"</strong>? This action cannot be undone.
          </p>

          <!-- Error alert when category has active transactions -->
          <div v-if="deleteError" class="form-error-panel margin-top">
            <va-icon name="error" color="danger" size="medium" />
            <span>{{ deleteError }}</span>
          </div>

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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/store/budget'
import { useServices } from '@/services'
import AppLayout from '@/components/AppLayout.vue'
import type { Category, TransactionType } from '@/types'

const budgetStore = useBudgetStore()
const { transactions } = useServices()

// Current filter type (income / expense)
const currentType = ref<TransactionType>('expense')

// ================= FIXED LOGICAL GROUPS DEFINITION =================
const CATEGORY_GROUPS = [
  {
    id: 'food_drinks',
    name: 'Food & Drinks',
    color: '#ff9100',
    icon: 'restaurant',
    type: 'expense',
  },
  { id: 'shopping', name: 'Shopping', color: '#8e44ad', icon: 'shopping_bag', type: 'expense' },
  { id: 'housing', name: 'Housing', color: '#2979ff', icon: 'home', type: 'expense' },
  {
    id: 'transportation',
    name: 'Transportation',
    color: '#0288d1',
    icon: 'directions_bus',
    type: 'expense',
  },
  { id: 'vehicle', name: 'Vehicle', color: '#455a64', icon: 'directions_car', type: 'expense' },
  {
    id: 'life_entertainment',
    name: 'Life & Entertainment',
    color: '#ff1744',
    icon: 'sports_esports',
    type: 'expense',
  },
  {
    id: 'communication_pc',
    name: 'Communication, PC',
    color: '#00acc1',
    icon: 'devices',
    type: 'expense',
  },
  {
    id: 'financial_expenses',
    name: 'Financial expenses',
    color: '#607d8b',
    icon: 'account_balance',
    type: 'expense',
  },
  {
    id: 'investments',
    name: 'Investments',
    color: '#2e7d32',
    icon: 'savings',
    type: 'expense',
  },
  { id: 'others', name: 'Others', color: '#78909c', icon: 'more_horiz', type: 'expense' },
  { id: 'income', name: 'Income', color: '#00a878', icon: 'payments', type: 'income' },
]

// Filter groups based on type
const filteredGroups = computed(() => {
  return CATEGORY_GROUPS.filter(g => g.type === form.value.type)
})

// Filtered raw categories
const filteredCategories = computed(() => {
  return budgetStore.categories.filter(c => c.type === currentType.value)
})

// Visual Categories grouping by pre-defined groups
const groupedCategories = computed(() => {
  // Initialize map
  const groupsMap = CATEGORY_GROUPS.reduce(
    (acc, g) => {
      acc[g.id] = {
        ...g,
        categories: [] as Category[],
      }
      return acc
    },
    {} as Record<
      (typeof CATEGORY_GROUPS)[0]['id'],
      (typeof CATEGORY_GROUPS)[0] & { categories: Category[] }
    >,
  )

  // Place categories into matching groups
  filteredCategories.value.forEach(cat => {
    const groupKey = cat.group_name || 'housing'
    if (groupsMap[groupKey]) {
      groupsMap[groupKey].categories.push(cat)
    } else {
      // Fallback
      const fallbackKey = cat.type === 'income' ? 'income' : 'housing'
      if (groupsMap[fallbackKey]) {
        groupsMap[fallbackKey].categories.push(cat)
      }
    }
  })

  // Return only groups that have categories
  return Object.values(groupsMap).filter(g => g.categories.length > 0)
})

// Load categories on mount if empty
const loadCategories = async () => {
  if (budgetStore.categories.length === 0) {
    try {
      const response = await transactions.getCategories()
      if (response.success && response.data) {
        budgetStore.setCategories(response.data)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }
}

// ================= ICON POOL =================
const iconPool = [
  'local_grocery_store',
  'home',
  'directions_car',
  'sports_esports',
  'payments',
  'spa',
  'medical_services',
  'flight_takeoff',
  'pets',
  'restaurant',
  'local_taxi',
  'face',
  'work',
  'school',
  'shopping_bag',
  'fitness_center',
  'savings',
  'build',
  'celebration',
  'star',
  'favorite',
  'coffee',
  'movie',
  'wifi',
]

// ================= FORM STATE & ACTIONS =================
const showFormModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const editingCategoryId = ref('')

onMounted(() => {
  loadCategories()
})

const form = ref({
  name: '',
  type: 'expense' as TransactionType,
  group_name: 'housing',
  icon: 'local_grocery_store',
})

// Watch type change to update default group
const onFormTypeChange = () => {
  if (form.value.type === 'income') {
    form.value.group_name = 'income'
  } else {
    form.value.group_name = 'housing'
  }
}

// Compute currently selected group color
const selectedGroupColor = computed(() => {
  const g = CATEGORY_GROUPS.find(group => group.id === form.value.group_name)
  return g ? g.color : ''
})

const openAddModal = () => {
  isEditing.value = false
  formError.value = ''
  form.value = {
    name: '',
    type: currentType.value,
    group_name: currentType.value === 'income' ? 'income' : 'housing',
    icon: iconPool[0],
  }
  showFormModal.value = true
}

const openEditModal = (cat: Category) => {
  isEditing.value = true
  formError.value = ''
  editingCategoryId.value = cat.id
  form.value = {
    name: cat.name,
    type: cat.type,
    group_name: cat.group_name || 'housing',
    icon: cat.icon,
  }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
}

const handleFormSubmit = async () => {
  if (!form.value.name.trim() || !form.value.icon || !form.value.group_name) return

  isSubmitting.value = true
  formError.value = ''

  try {
    const payload = {
      name: form.value.name.trim(),
      icon: form.value.icon,
      group_name: form.value.group_name,
      type: form.value.type,
    }

    if (isEditing.value) {
      // Update
      const response = await transactions.updateCategory(editingCategoryId.value, payload)

      if (response.success) {
        const matchingGroup = CATEGORY_GROUPS.find(g => g.id === form.value.group_name)
        const updatedCat: Category = {
          id: editingCategoryId.value,
          name: form.value.name.trim(),
          icon: form.value.icon,
          color: matchingGroup ? matchingGroup.color : '#607d8b',
          type: form.value.type,
          group_name: form.value.group_name,
          is_default: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        budgetStore.updateCategory(updatedCat)
        showFormModal.value = false
      } else {
        formError.value = response.error || 'Failed to update category.'
      }
    } else {
      // Create
      const response = await transactions.createCategory(payload)

      if (response.success && response.data) {
        const matchingGroup = CATEGORY_GROUPS.find(g => g.id === form.value.group_name)
        const newCat: Category = {
          id: response.data.id,
          name: form.value.name.trim(),
          icon: form.value.icon,
          color: matchingGroup ? matchingGroup.color : '#607d8b',
          type: form.value.type,
          group_name: form.value.group_name,
          is_default: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        budgetStore.appendCategory(newCat)
        showFormModal.value = false
      } else {
        formError.value = response.error || 'Failed to create category.'
      }
    }
  } catch (err) {
    console.error(err)
    formError.value = 'A network error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// ================= DELETE STATE & ACTIONS =================
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')
const categoryToDelete = ref<Category | null>(null)

const confirmDelete = (cat: Category) => {
  categoryToDelete.value = cat
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  if (!isDeleting.value) {
    showDeleteModal.value = false
    categoryToDelete.value = null
  }
}

const handleDeleteSubmit = async () => {
  if (!categoryToDelete.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const response = await transactions.deleteCategory(categoryToDelete.value.id)
    if (response.success) {
      budgetStore.removeCategory(categoryToDelete.value.id)
      showDeleteModal.value = false
      categoryToDelete.value = null
    } else {
      deleteError.value = response.error || 'Failed to delete category.'
    }
  } catch (err) {
    console.error(err)
    deleteError.value = 'A network error occurred. Please try again.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.categories-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.header-row {
  margin-bottom: 32px;
}

.col-header {
  padding: 0;
}

.main-header-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    h2 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
      color: var(--text-primary);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* ─── Group Sections ──────────────────────────────────────────── */
.groups-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;

  .group-header-badge {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgb(from var(--group-color) r g b / 20%);
  }

  .group-header-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;

    .group-count-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      background: var(--glass-border);
      padding: 1px 6px;
      border-radius: 99px;
    }
  }

  .group-header-line {
    flex-grow: 1;
    height: 1px;
    background: var(--glass-border);
    margin-left: 12px;
  }
}

/* ─── Grid ────────────────────────────────────────────────────── */
.grid-row {
  margin: 0 -8px;
  gap: 16px 0;
}

.col-card {
  padding: 0 8px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  position: relative;
  overflow: hidden;
  height: 100%;
  border-radius: 14px;
  transition: all 0.25s ease;

  &:hover {
    border-color: var(--cat-color);
    box-shadow: 0 8px 24px rgb(from var(--cat-color) r g b / 8%);
    transform: translateY(-2px);
  }

  .card-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgb(from var(--cat-color) r g b / 20%);
  }

  .card-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;
    gap: 4px;

    .card-name {
      font-weight: 600;
      font-size: 0.92rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .default-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-secondary);
      background: var(--glass-border);
      align-self: flex-start;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .custom-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--primary);
      background: rgb(21 78 193 / 6%);
      align-self: flex-start;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition:
      background 0.15s ease,
      transform 0.1s ease;
    outline: none;

    &:active {
      transform: scale(0.92);
    }

    &--edit {
      background: rgb(21 78 193 / 12%);
      color: var(--primary);

      &:hover {
        background: rgb(21 78 193 / 22%);
      }
    }

    &--delete {
      background: rgb(255 23 68 / 10%);
      color: var(--danger, #ff1744);

      &:hover {
        background: rgb(255 23 68 / 20%);
      }
    }
  }

  .lock-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--glass-border);
    color: var(--text-secondary);
    opacity: 0.6;
  }
}

/* ─── Empty state ────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: var(--text-secondary);

  p {
    margin-top: 12px;
    font-size: 0.95rem;
    font-weight: 500;
  }
}

/* ─── Animation effects ────────────────────────────────────────── */
.animate-card {
  animation: fade-in-up 0.3s ease forwards;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style lang="scss">
/* ─── Non-scoped styles for body-attached modals ───────────────── */
.category-form-modal,
.delete-confirm-modal {
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

  .category-form {
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

  .submit-button {
    margin-top: 8px;
    padding: 10px 0;
  }

  .form-label-with-color {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .group-color-pill-preview {
    width: 24px;
    height: 12px;
    border-radius: 99px;
    box-shadow: 0 2px 6px rgb(0 0 0 / 10%);
    border: 1px solid var(--glass-border);
    transition: background-color 0.25s ease;
  }

  .group-help-text {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-secondary);
    font-style: italic;
    margin-top: -2px;
  }

  .native-group-select {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--glass-border);
    background: transparent;
    color: var(--text-primary);
    font-size: 0.88rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: var(--primary);
    }

    &:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgb(21 78 193 / 12%);
    }
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    max-height: 160px;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--glass-border);
    border-radius: 8px;

    .icon-select-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 38px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--glass-border);
      }

      &.active {
        background: rgb(21 78 193 / 10%);
        border-color: var(--primary);
        color: var(--primary);
      }
    }
  }

  .form-error-panel {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgb(255 23 68 / 8%);
    border: 1px solid rgb(255 23 68 / 20%);
    border-radius: 8px;
    color: var(--danger);
    font-size: 0.82rem;
    font-weight: 500;
  }

  .margin-top {
    margin-top: 16px;
  }

  .delete-content {
    p {
      font-size: 0.95rem;
      color: var(--text-primary);
      line-height: 1.6;
      margin-bottom: 24px;
    }
  }

  .delete-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
