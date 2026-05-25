<template>
  <div class="period-picker-container">
    <div class="period-picker-bar glass-panel">
      <button
        type="button"
        :disabled="currentTab === 'all'"
        class="nav-arrow-btn"
        @click="navigatePeriod(-1)"
      >
        <va-icon name="chevron_left" color="textPrimary" />
      </button>

      <va-dropdown
        v-model="isDropdownOpen"
        :close-on-content-click="false"
        :offset="8"
        :auto-placement="false"
        trigger="click"
        placement="bottom"
        content-class="period-dropdown-content"
        class="period-dropdown"
      >
        <template #anchor>
          <button
            type="button"
            class="period-display-trigger"
            :aria-expanded="isDropdownOpen"
            aria-haspopup="dialog"
          >
            <span class="period-label">{{ displayLabel }}</span>
            <va-icon name="unfold_more" size="small" color="textSecondary" />
          </button>
        </template>

        <div class="period-selector-popover glass-panel" role="dialog">
          <!-- Selection Tabs -->
          <div class="popover-tabs">
            <button
              v-for="tab in tabOptions"
              :key="tab.value"
              class="popover-tab-btn"
              :class="{ active: currentTab === tab.value }"
              @click="setTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content: Months -->
          <div v-if="currentTab === 'months'" class="tab-content months-content">
            <div class="year-navigator">
              <va-button preset="plain" icon="chevron_left" size="small" @click="changeYear(-1)" />
              <span class="navigator-year">{{ selectedYear }}</span>
              <va-button preset="plain" icon="chevron_right" size="small" @click="changeYear(1)" />
            </div>

            <div class="months-grid">
              <button
                v-for="(mon, index) in monthsList"
                :key="mon"
                class="month-btn"
                :class="{ active: selectedMonth === index }"
                @click="selectMonth(index, true)"
              >
                {{ mon }}
              </button>
            </div>
          </div>

          <!-- Tab Content: Years -->
          <div v-if="currentTab === 'years'" class="tab-content years-content">
            <div class="years-grid">
              <button
                v-for="yr in yearsList"
                :key="yr"
                class="year-btn"
                :class="{ active: selectedYear === yr }"
                @click="selectYear(yr, true)"
              >
                {{ yr }}
              </button>
            </div>
          </div>

          <!-- Tab Content: Custom Range -->
          <div v-if="currentTab === 'custom'" class="tab-content custom-content">
            <div class="custom-inputs">
              <div class="input-field">
                <label>Start Date</label>
                <input v-model="customStart" type="date" class="flat-date-input" />
              </div>
              <div class="input-field">
                <label>End Date</label>
                <input v-model="customEnd" type="date" class="flat-date-input" />
              </div>
            </div>
            <va-button
              color="primary"
              size="small"
              class="apply-btn"
              :disabled="!customStart || !customEnd"
              @click="applyCustomRange(true)"
            >
              Apply Range
            </va-button>
          </div>
        </div>
      </va-dropdown>

      <button
        type="button"
        :disabled="currentTab === 'all'"
        class="nav-arrow-btn"
        @click="navigatePeriod(1)"
      >
        <va-icon name="chevron_right" color="textPrimary" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{
  (
    e: 'change',
    payload: { startDate: string | null; endDate: string | null; label: string; tab: string },
  ): void
}>()

type PickerTab = 'custom' | 'months' | 'years' | 'all'

const props = withDefaults(
  defineProps<{
    defaultTab?: PickerTab
  }>(),
  {
    defaultTab: 'months',
  },
)

const currentTab = ref<PickerTab>(props.defaultTab)
const isDropdownOpen = ref(false)
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth())

const customStart = ref('')
const customEnd = ref('')

const tabOptions: Array<{ label: string; value: PickerTab }> = [
  { label: 'Custom range', value: 'custom' },
  { label: 'Months', value: 'months' },
  { label: 'Years', value: 'years' },
  { label: 'All period', value: 'all' },
]

const monthsList = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const yearsList = computed(() => {
  const current = new Date().getFullYear()
  const list = []
  for (let i = current - 5; i <= current + 2; i++) {
    list.push(i)
  }
  return list
})

// Display Label Computation
const displayLabel = computed(() => {
  if (currentTab.value === 'months') {
    return `${monthsList[selectedMonth.value]} ${selectedYear.value}`
  }
  if (currentTab.value === 'years') {
    return `${selectedYear.value} Year`
  }
  if (currentTab.value === 'custom') {
    if (customStart.value && customEnd.value) {
      return `${customStart.value} to ${customEnd.value}`
    }
    return 'Select Range'
  }
  return 'All time records'
})

// Tab Switch
const setTab = (tab: PickerTab) => {
  currentTab.value = tab
  if (tab === 'all') {
    applyAllPeriod(true)
  } else if (tab === 'months') {
    selectMonth(selectedMonth.value, false)
  } else if (tab === 'years') {
    selectYear(selectedYear.value, false)
  }
}

// Year Increment / Decrement
const changeYear = (amount: number) => {
  selectedYear.value += amount
  if (currentTab.value === 'months') {
    triggerPeriodChange()
  }
}

// Select specific Month
const selectMonth = (monthIndex: number, close = false) => {
  selectedMonth.value = monthIndex
  currentTab.value = 'months'
  triggerPeriodChange()
  if (close) {
    isDropdownOpen.value = false
  }
}

// Select specific Year
const selectYear = (year: number, close = false) => {
  selectedYear.value = year
  currentTab.value = 'years'
  triggerPeriodChange()
  if (close) {
    isDropdownOpen.value = false
  }
}

// Custom Range Apply
const applyCustomRange = (close = false) => {
  if (!customStart.value || !customEnd.value) return
  emit('change', {
    startDate: customStart.value,
    endDate: customEnd.value,
    label: `${customStart.value} - ${customEnd.value}`,
    tab: 'custom',
  })
  if (close) {
    isDropdownOpen.value = false
  }
}

// All Time Apply
const applyAllPeriod = (close = false) => {
  emit('change', {
    startDate: null,
    endDate: null,
    label: 'All time records',
    tab: 'all',
  })
  if (close) {
    isDropdownOpen.value = false
  }
}

// Trigger standard changes for Month/Year modes
const triggerPeriodChange = () => {
  if (currentTab.value === 'months') {
    const start = new Date(selectedYear.value, selectedMonth.value, 1)
    const end = new Date(selectedYear.value, selectedMonth.value + 1, 0)
    emit('change', {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: displayLabel.value,
      tab: 'months',
    })
  } else if (currentTab.value === 'years') {
    const start = new Date(selectedYear.value, 0, 1)
    const end = new Date(selectedYear.value, 11, 31)
    emit('change', {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: displayLabel.value,
      tab: 'years',
    })
  }
}

// Navigation arrows: left and right period shifting
const navigatePeriod = (dir: number) => {
  if (currentTab.value === 'months') {
    let nextMonth = selectedMonth.value + dir
    if (nextMonth < 0) {
      nextMonth = 11
      selectedYear.value -= 1
    } else if (nextMonth > 11) {
      nextMonth = 0
      selectedYear.value += 1
    }
    selectedMonth.value = nextMonth
    triggerPeriodChange()
  } else if (currentTab.value === 'years') {
    selectedYear.value += dir
    triggerPeriodChange()
  } else if (currentTab.value === 'custom' && customStart.value && customEnd.value) {
    const start = new Date(customStart.value)
    const end = new Date(customEnd.value)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    start.setDate(start.getDate() + dir * diffDays)
    end.setDate(end.getDate() + dir * diffDays)

    customStart.value = formatDate(start)
    customEnd.value = formatDate(end)
    applyCustomRange()
  }
}

const formatDate = (d: Date) => {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// Initialize on mount
onMounted(() => {
  triggerPeriodChange()
})
</script>

<style lang="scss" scoped>
.period-picker-container {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 20;
  min-height: 56px;
  overflow: visible;
}

.period-picker-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  width: 100%;
  min-height: 52px;
  border-radius: 12px;
  overflow: visible;
}

.period-picker-bar.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--card-shadow);
}

.nav-arrow-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease;

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: rgb(21 78 193 / 8%);
  }

  .va-icon {
    font-size: 1.3rem !important;
  }
}

.period-dropdown {
  flex: none;
  display: flex;
  justify-content: center;
}

.period-display-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
  border: 1px solid var(--primary);
  border-radius: 99px;
  cursor: pointer;
  background: var(--bg-primary);
  transition: all 0.2s ease;
  min-width: 160px;
  max-width: 240px;
  width: 100%;
  justify-content: center;
  overflow: hidden;
  font-family: inherit;

  &:hover {
    background: rgb(21 78 193 / 6%);
  }
}

.period-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Selector Popover Styles */
.period-selector-popover {
  width: 320px;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10000;
}

:global(.period-dropdown-content) {
  z-index: 10000 !important;
}

.popover-tabs {
  display: flex;
  background: var(--bg-primary);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  gap: 2px;
}

.popover-tab-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 6px 4px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary);
    color: #fff;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Months Selection Tab */
.year-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.navigator-year {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.month-btn,
.year-btn {
  border: 1px solid var(--glass-border);
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    background: rgb(21 78 193 / 4%);
  }

  &.active {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }
}

/* Years Selection Tab */
.years-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* Custom Range Selection Tab */
.custom-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
}

.flat-date-input {
  border: 1px solid var(--glass-border);
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: var(--primary);
  }
}

.apply-btn {
  width: 100%;
  margin-top: 4px;
}

.all-info-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  margin: 8px 0;
}
</style>
