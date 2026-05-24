<template>
  <div class="category-picker">
    <!-- Step 1: Group selector -->
    <div class="picker-label">Group</div>
    <div class="group-tabs">
      <button
        v-for="group in availableGroups"
        :key="group.id"
        type="button"
        class="group-tab"
        :class="{ active: selectedGroupId === group.id }"
        :style="selectedGroupId === group.id ? { '--tab-color': group.color } : {}"
        @click="selectGroup(group.id)"
      >
        <va-icon :name="group.icon" size="small" />
        <span>{{ group.shortName }}</span>
      </button>
    </div>

    <!-- Step 2: Category list -->
    <div v-if="selectedGroupId" class="picker-label">Category</div>
    <div v-if="selectedGroupId" class="category-chips">
      <button
        v-for="cat in categoriesInGroup"
        :key="cat.id"
        type="button"
        class="category-chip"
        :class="{ active: modelValue === cat.id }"
        :style="{ '--chip-color': cat.color }"
        @click="emit('update:modelValue', cat.id)"
      >
        <span class="chip-icon" :style="{ backgroundColor: cat.color }">
          <va-icon :name="cat.icon" size="small" color="#fff" />
        </span>
        <span class="chip-name">{{ cat.name }}</span>
      </button>

      <p v-if="categoriesInGroup.length === 0" class="empty-group">No categories in this group.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Category, TransactionType } from '@/types'

const props = defineProps<{
  modelValue: string
  categories: Category[]
  type: TransactionType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// All available groups (shared constant — mirrors CategoriesView)
const ALL_GROUPS = [
  {
    id: 'food_drinks',
    name: 'Food & Drinks',
    shortName: 'Food',
    color: '#ff9100',
    icon: 'restaurant',
    type: 'expense',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    shortName: 'Shopping',
    color: '#8e44ad',
    icon: 'shopping_bag',
    type: 'expense',
  },
  {
    id: 'housing',
    name: 'Housing',
    shortName: 'Housing',
    color: '#2979ff',
    icon: 'home',
    type: 'expense',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    shortName: 'Transit',
    color: '#0288d1',
    icon: 'directions_bus',
    type: 'expense',
  },
  {
    id: 'vehicle',
    name: 'Vehicle',
    shortName: 'Vehicle',
    color: '#455a64',
    icon: 'directions_car',
    type: 'expense',
  },
  {
    id: 'life_entertainment',
    name: 'Life & Entertainment',
    shortName: 'Life',
    color: '#ff1744',
    icon: 'sports_esports',
    type: 'expense',
  },
  {
    id: 'communication_pc',
    name: 'Communication, PC',
    shortName: 'Comms',
    color: '#00acc1',
    icon: 'devices',
    type: 'expense',
  },
  {
    id: 'financial_expenses',
    name: 'Financial expenses',
    shortName: 'Finance',
    color: '#607d8b',
    icon: 'account_balance',
    type: 'expense',
  },
  {
    id: 'investments',
    name: 'Investments',
    shortName: 'Invest',
    color: '#2e7d32',
    icon: 'savings',
    type: 'expense',
  },
  {
    id: 'others',
    name: 'Others',
    shortName: 'Other',
    color: '#78909c',
    icon: 'more_horiz',
    type: 'expense',
  },
  {
    id: 'income',
    name: 'Income',
    shortName: 'Income',
    color: '#00a878',
    icon: 'payments',
    type: 'income',
  },
] as const

// Only groups that have at least one category for current type
const availableGroups = computed(() => {
  const ids = new Set(props.categories.filter(c => c.type === props.type).map(c => c.group_name))
  return ALL_GROUPS.filter(g => g.type === props.type && ids.has(g.id))
})

const selectedGroupId = ref<string>('')

// Auto-select group from the currently selected category
const syncGroupFromValue = () => {
  if (!props.modelValue) {
    selectedGroupId.value = availableGroups.value[0]?.id ?? ''
    return
  }
  const cat = props.categories.find(c => c.id === props.modelValue)
  if (cat) {
    selectedGroupId.value = cat.group_name
  } else {
    selectedGroupId.value = availableGroups.value[0]?.id ?? ''
  }
}

watch(() => props.modelValue, syncGroupFromValue, { immediate: true })
watch(
  () => [props.type, props.categories.length],
  () => {
    selectedGroupId.value = availableGroups.value[0]?.id ?? ''
  },
)

const selectGroup = (groupId: string) => {
  selectedGroupId.value = groupId
  // Auto-select first category in new group
  const first = categoriesInGroup.value[0]
  if (first) emit('update:modelValue', first.id)
}

const categoriesInGroup = computed(() =>
  props.categories.filter(c => c.type === props.type && c.group_name === selectedGroupId.value),
)
</script>

<style scoped>
.category-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ─── Group tabs ─────────────────────────────────────────── */
.group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.group-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    border-color: var(--text-secondary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--tab-color);
    border-color: var(--tab-color);
    color: #fff;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--tab-color) 40%, transparent);
  }
}

/* ─── Category chips ─────────────────────────────────────── */
.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px 7px 6px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-primary);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--chip-color);
    background: color-mix(in srgb, var(--chip-color) 8%, transparent);
  }

  .chip-icon {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: box-shadow 0.15s ease;
  }

  &.active {
    border-color: var(--chip-color);
    background: color-mix(in srgb, var(--chip-color) 15%, transparent);
    color: var(--chip-color);

    .chip-icon {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--chip-color) 30%, transparent);
    }
  }

  .chip-name {
    white-space: nowrap;
  }
}

.empty-group {
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}
</style>
