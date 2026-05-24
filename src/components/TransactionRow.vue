<template>
  <article
    class="transaction-row"
    :class="`transaction-row--${item.type}`"
    :aria-label="rowAriaLabel"
    @click="handleRowClick"
  >
    <div class="tx-left">
      <div
        class="category-icon-wrapper"
        :style="{
          '--category-color': categoryColor,
        }"
        aria-hidden="true"
      >
        <va-icon :name="item.category?.icon || 'help'" :color="categoryColor" size="medium" />
      </div>

      <div class="tx-details">
        <div class="tx-title-line">
          <h3 class="tx-description">{{ displayTitle }}</h3>
          <span class="tx-badge-type" :class="item.type === 'income' ? 'income-bg' : 'expense-bg'">
            {{ typeLabel }}
          </span>
        </div>

        <dl class="tx-meta">
          <div v-if="item.description" class="tx-meta-item">
            <dt>Category</dt>
            <dd>{{ categoryName }}</dd>
          </div>
          <div class="tx-meta-item">
            <dt>Date</dt>
            <dd>{{ formattedDate }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="tx-right">
      <span class="tx-amount" :class="item.type === 'income' ? 'income-color' : 'expense-color'">
        {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
      </span>
      <div class="tx-actions">
        <va-button
          preset="secondary"
          icon="edit"
          color="primary"
          size="medium"
          class="action-btn edit-btn"
          :aria-label="`Edit transaction: ${displayTitle}`"
          :title="`Edit transaction: ${displayTitle}`"
          @click="$emit('edit')"
        />
        <va-button
          preset="secondary"
          icon="delete"
          color="danger"
          size="medium"
          class="action-btn delete-btn"
          :aria-label="`Delete transaction: ${displayTitle}`"
          :title="`Delete transaction: ${displayTitle}`"
          @click="$emit('delete')"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction, Category } from '@/types'

const props = defineProps<{
  item: Transaction & { category?: Category }
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'mobileClick'): void
}>()

const handleRowClick = () => {
  if (window.innerWidth <= 640) {
    emit('mobileClick')
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}

const categoryColor = computed(() => props.item.category?.color || '#a5b0c0')
const categoryName = computed(() => props.item.category?.name || 'Uncategorized')
const displayTitle = computed(() => props.item.description || categoryName.value)
const typeLabel = computed(() => (props.item.type === 'income' ? 'Income' : 'Expense'))
const signedAmount = computed(() => {
  const prefix = props.item.type === 'income' ? 'plus' : 'minus'
  return `${prefix} ${formatCurrency(props.item.amount)}`
})

const formattedDate = computed(() => {
  const date = new Date(`${props.item.date}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return props.item.date
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
})

const rowAriaLabel = computed(
  () =>
    `${typeLabel.value} transaction, ${displayTitle.value}, ${categoryName.value}, ${formattedDate.value}, ${signedAmount.value}`,
)
</script>

<style lang="scss" scoped>
.transaction-row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 16px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  box-shadow: 0 1px 0 rgb(27 29 35 / 4%);
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--tx-accent) 18%, transparent);
  }

  &--income {
    --tx-accent: #00a878;
  }

  &--expense {
    --tx-accent: #e5484d;
  }
}

.tx-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.category-icon-wrapper {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--category-color) 13%, transparent);
  border: 1px solid color-mix(in srgb, var(--category-color) 34%, var(--glass-border));
}

.tx-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tx-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tx-description {
  margin: 0;
  font-weight: 600;
  font-size: 0.98rem;
  line-height: 1.25;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.tx-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:not(:last-child)::after {
    content: '';
    width: 4px;
    height: 4px;
    margin-left: 4px;
    border-radius: 50%;
    background: currentcolor;
    opacity: 0.35;
  }

  dt {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  dd {
    margin: 0;
  }
}

.tx-badge-type {
  flex: 0 0 auto;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 4px;
  letter-spacing: 0;
  line-height: 1.1;
}

.income-bg {
  background: rgb(0 168 120 / 12%);
  color: #007a58;
}

.expense-bg {
  background: rgb(229 72 77 / 12%);
  color: #c62f35;
}

.tx-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex: 0 0 auto;
  margin-left: auto;
}

.tx-amount {
  min-width: 104px;
  text-align: right;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.income-color {
  color: #00875f;
}

.expense-color {
  color: #d92d3a;
}

.tx-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  min-width: 42px;
  min-height: 42px;
  border-radius: 8px;
  transition: transform 0.2s ease;

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--tx-accent) 70%, var(--text-primary));
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.96);
  }
}

@media (width <= 640px) {
  .transaction-row {
    align-items: center;
    flex-direction: row;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
  }

  .tx-badge-type,
  .tx-actions {
    display: none;
  }

  .tx-left {
    width: auto;
    flex: 1 1 0;
    min-width: 0;
  }

  .tx-right {
    width: auto;
    flex: 0 0 auto;
    justify-content: flex-end;
  }

  .tx-title-line {
    width: 100%;
    min-width: 0;
  }

  .tx-description {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tx-meta {
    width: 100%;
    min-width: 0;
  }

  .tx-meta-item {
    min-width: 0;
  }

  .tx-meta-item dd {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tx-amount {
    min-width: auto;
    text-align: right;
  }
}
</style>
