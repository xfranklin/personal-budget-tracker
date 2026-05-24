<template>
  <AppLayout>
    <div class="transfer-container">
      <div class="transfer-header">
        <div class="transfer-title">
          <va-icon name="sync_alt" size="large" color="primary" />
          <div>
            <h1>Import / Export</h1>
            <p>Move records with amount, date, and category only.</p>
          </div>
        </div>
      </div>

      <div class="transfer-grid">
        <section class="glass-panel transfer-panel">
          <div class="panel-header">
            <div>
              <h2>Import Data</h2>
              <p>Paste a JSON array. Extra fields are ignored.</p>
            </div>
            <va-icon name="upload_file" size="large" color="primary" />
          </div>

          <div class="form-group">
            <label class="form-label" for="import-json">JSON payload</label>
            <textarea
              id="import-json"
              v-model="importText"
              class="import-textarea"
              spellcheck="false"
              placeholder='[{ "date": "01-03-2023", "category": "Groceries", "amount": -44.9 }]'
            />
          </div>

          <div class="import-actions">
            <va-button
              color="primary"
              icon="upload"
              :loading="isImporting"
              :disabled="!importText.trim() || isImporting"
              @click="handleImport"
            >
              Import
            </va-button>
            <va-button preset="secondary" icon="cleaning_services" @click="resetImport">
              Clear
            </va-button>
            <va-button preset="secondary" icon="description" @click="importFileInput?.click()">
              JSON File
            </va-button>
            <input
              ref="importFileInput"
              class="sr-only"
              type="file"
              accept="application/json,.json"
              @change="handleFileSelected"
            />
          </div>

          <div v-if="importError" class="status-panel status-panel--error">
            <va-icon name="error" color="danger" size="medium" />
            <span>{{ importError }}</span>
          </div>

          <div v-if="importResult" class="status-panel status-panel--success">
            <va-icon name="check_circle" color="success" size="medium" />
            <span>{{ importResult }}</span>
          </div>

          <div v-if="previewRows.length" class="preview-table">
            <div class="preview-row preview-row--head">
              <span>Date</span>
              <span>Category</span>
              <span>Amount</span>
            </div>
            <div
              v-for="(row, index) in previewRows"
              :key="`${row.date}-${index}`"
              class="preview-row"
            >
              <span>{{ row.date }}</span>
              <span>{{ row.category }}</span>
              <span>{{ formatSignedAmount(row.amount) }}</span>
            </div>
          </div>
        </section>

        <section class="glass-panel transfer-panel">
          <div class="panel-header">
            <div>
              <h2>Export Data</h2>
              <p>Download records using the same three fields.</p>
            </div>
            <va-icon name="download" size="large" color="primary" />
          </div>

          <div class="export-summary">
            <div class="summary-item">
              <span class="summary-label">Records</span>
              <span class="summary-value">{{ exportRows.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Categories</span>
              <span class="summary-value">{{ budgetStore.categories.length }}</span>
            </div>
          </div>

          <div class="export-actions">
            <va-button
              color="primary"
              icon="download"
              :disabled="exportRows.length === 0"
              @click="downloadExport"
            >
              Export JSON
            </va-button>
            <va-button
              preset="secondary"
              icon="content_copy"
              :disabled="exportRows.length === 0"
              @click="copyExport"
            >
              Copy
            </va-button>
          </div>

          <div v-if="exportMessage" class="status-panel status-panel--success">
            <va-icon name="check_circle" color="success" size="medium" />
            <span>{{ exportMessage }}</span>
          </div>

          <pre class="export-preview">{{ exportPreview }}</pre>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useBudgetStore } from '@/store/budget'
import { useServices } from '@/services'
import type { Transaction, TransactionType } from '@/types'

type TransferRow = {
  amount: number
  date: string
  category: string
}

const budgetStore = useBudgetStore()
const { transactions } = useServices()

const importText = ref('')
const importFileInput = ref<HTMLInputElement | null>(null)
const importError = ref('')
const importResult = ref('')
const exportMessage = ref('')
const isImporting = ref(false)

const loadData = async () => {
  try {
    const [txRes, catRes] = await Promise.all([
      transactions.getTransactions(),
      transactions.getCategories(),
    ])

    if (txRes.success && txRes.data) {
      budgetStore.setTransactions(txRes.data)
    }

    if (catRes.success && catRes.data) {
      budgetStore.setCategories(catRes.data)
    }
  } catch (err) {
    console.error('Failed to load import/export data:', err)
  }
}

onMounted(() => {
  loadData()
})

const parseImportRows = (): TransferRow[] => {
  const parsed = JSON.parse(importText.value) as unknown

  const records = Array.isArray(parsed) ? parsed : [parsed]

  return records.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Record ${index + 1} is not an object.`)
    }

    const source = item as Record<string, unknown>
    const amount = Number(source.amount)
    const date = String(source.date || '').trim()
    const category = String(source.category || '').trim()

    if (!Number.isFinite(amount) || amount === 0) {
      throw new Error(`Record ${index + 1} has an invalid amount.`)
    }

    if (!date) {
      throw new Error(`Record ${index + 1} has no date.`)
    }

    if (!category) {
      throw new Error(`Record ${index + 1} has no category.`)
    }

    return {
      amount,
      date,
      category,
    }
  })
}

const normalizeDate = (value: string) => {
  const trimmed = value.trim()
  const ddmmyyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/)

  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    return `${year}-${month}-${day}`
  }

  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (yyyymmdd) {
    return trimmed
  }

  throw new Error(`Unsupported date format: ${value}. Use DD-MM-YYYY or YYYY-MM-DD.`)
}

const formatExportDate = (value: string) => {
  const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!yyyymmdd) return value

  const [, year, month, day] = yyyymmdd
  return `${day}-${month}-${year}`
}

const findCategoryId = (name: string, type: TransactionType) => {
  const normalized = name.trim().toLocaleLowerCase()
  return budgetStore.categories.find(
    category => category.type === type && category.name.trim().toLocaleLowerCase() === normalized,
  )?.id
}

const previewRows = computed(() => {
  if (!importText.value.trim()) return []

  try {
    return parseImportRows().slice(0, 5)
  } catch {
    return []
  }
})

const exportRows = computed<TransferRow[]>(() =>
  budgetStore.transactionsWithCategory.map(item => ({
    date: formatExportDate(item.date),
    category: item.category?.name || 'Uncategorized',
    amount: item.type === 'income' ? item.amount : -item.amount,
  })),
)

const exportPreview = computed(() => JSON.stringify(exportRows.value.slice(0, 12), null, 2))

const handleImport = async () => {
  importError.value = ''
  importResult.value = ''
  exportMessage.value = ''

  let rows: TransferRow[]

  try {
    rows = parseImportRows()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Invalid JSON payload.'
    return
  }

  isImporting.value = true
  let imported = 0

  try {
    for (const row of rows) {
      const type: TransactionType = row.amount < 0 ? 'expense' : 'income'
      const categoryId = findCategoryId(row.category, type)

      if (!categoryId) {
        throw new Error(`Category "${row.category}" was not found for ${type}.`)
      }

      const payload = {
        amount: Math.abs(row.amount),
        type,
        categoryId,
        date: normalizeDate(row.date),
        description: undefined,
      }

      const response = await transactions.createTransaction(payload)

      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to import "${row.category}" on ${row.date}.`)
      }

      const newTx: Transaction = {
        ...payload,
        id: response.data.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      budgetStore.appendTransaction(newTx)
      imported += 1
    }

    importResult.value = `Imported ${imported} record${imported === 1 ? '' : 's'}.`
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Import failed.'
  } finally {
    isImporting.value = false
  }
}

const resetImport = () => {
  importText.value = ''
  importError.value = ''
  importResult.value = ''

  if (importFileInput.value) {
    importFileInput.value.value = ''
  }
}

const handleFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  importError.value = ''
  importResult.value = ''
  importText.value = await file.text()
}

const exportJson = () => JSON.stringify(exportRows.value, null, 2)

const downloadExport = () => {
  exportMessage.value = ''
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  exportMessage.value = 'Export file is ready.'
}

const copyExport = async () => {
  exportMessage.value = ''
  await navigator.clipboard.writeText(exportJson())
  exportMessage.value = 'Export JSON copied.'
}

const formatSignedAmount = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
</script>

<style lang="scss" scoped>
.transfer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.transfer-title {
  display: flex;
  align-items: center;
  gap: 14px;

  h1 {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.2;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-secondary);
  }
}

.transfer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.transfer-panel {
  padding: 22px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--glass-border);

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0;
}

.import-textarea {
  width: 100%;
  min-height: 260px;
  box-sizing: border-box;
  resize: vertical;
  padding: 14px;
  overflow: auto;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.5;
  outline: none;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgb(21 78 193 / 12%);
  }
}

.import-actions,
.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.sr-only {
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

.status-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;

  &--error {
    color: #d92d3a;
    background: rgb(229 72 77 / 10%);
  }

  &--success {
    color: #00875f;
    background: rgb(0 168 120 / 10%);
  }
}

.preview-table {
  display: flex;
  flex-direction: column;
  margin-top: 18px;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  overflow: hidden;
}

.preview-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 120px;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--glass-border);
  font-size: 0.88rem;

  &:last-child {
    border-bottom: 0;
  }

  &--head {
    font-weight: 700;
    color: var(--text-secondary);
    background: rgb(21 78 193 / 6%);
  }
}

.export-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 16px;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.summary-label {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0;
}

.summary-value {
  display: block;
  margin-top: 6px;
  color: var(--text-primary);
  font-size: 1.35rem;
  font-weight: 800;
}

.export-preview {
  min-height: 260px;
  max-height: 420px;
  box-sizing: border-box;
  margin: 18px 0 0;
  padding: 14px;
  overflow: auto;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.84rem;
  line-height: 1.5;
}

@media (width <= 820px) {
  .transfer-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 560px) {
  .transfer-panel {
    padding: 16px;
  }

  .preview-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
