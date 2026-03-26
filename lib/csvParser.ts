import { BankFormat, Transaction } from '@/types'
import Papa from 'papaparse'

export function detectBank(headers: string[]): BankFormat {
  const normalized = headers.map((h) => h.toLowerCase().trim())
  
  const hasHdfc = normalized.includes('narration') && 
                  normalized.some(h => h.includes('withdrawal') || h.includes('debit'))
  if (hasHdfc) return 'hdfc'

  const hasIcici = normalized.includes('transaction remarks') && 
                   normalized.some(h => h.includes('amount'))
  if (hasIcici) return 'icici'

  const hasAxis = normalized.includes('particulars') && 
                  normalized.some(h => h.includes('tran date') || h.includes('transaction date'))
  if (hasAxis) return 'axis'

  return 'unknown'
}

function normalizeDate(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()

  // Try DD/MM/YY or DD/MM/YYYY
  const dmySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (dmySlash) {
    const [, d, m, y] = dmySlash
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Try DD-MM-YYYY
  const dmyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dmyDash) {
    const [, d, m, y] = dmyDash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Try YYYY-MM-DD (already ISO)
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return trimmed.slice(0, 10)

  // Try DD MMM YYYY (e.g. "26 Jan 2024")
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const dmy = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (dmy) {
    const [, d, mon, y] = dmy
    return `${y}-${months[mon.toLowerCase()] ?? '01'}-${d.padStart(2, '0')}`
  }

  // Fallback: try native Date parsing
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return trimmed
}

function parseAmount(raw: string): number {
  if (!raw) return 0
  const cleaned = raw.replace(/,/g, '').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : Math.abs(n)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function parseHDFC(rows: Row[], userId: string): Partial<Transaction>[] {
  return rows
    .filter((r) => r['narration'] && (r['date'] || r['value dt']))
    .map((r) => {
      // Find the withdrawal and deposit keys dynamically in case of Excel naming variations
      const withdrawalKey = Object.keys(r).find(k => k.includes('withdrawal') || k === 'debit') ?? ''
      const depositKey = Object.keys(r).find(k => k.includes('deposit') || k === 'credit') ?? ''
      
      const withdrawal = parseAmount(r[withdrawalKey] ?? '')
      const deposit = parseAmount(r[depositKey] ?? '')
      const isDebit = withdrawal > 0
      
      const dateKey = r['date'] ? 'date' : 'value dt'
      
      return {
        user_id: userId,
        date: normalizeDate(r[dateKey]),
        amount: isDebit ? withdrawal : deposit,
        type: isDebit ? 'debit' as const : 'credit' as const,
        raw_merchant: (r['narration'] ?? '').trim(),
      }
    })
    .filter((t) => t.amount! > 0)
}

function parseICICI(rows: Row[], userId: string): Partial<Transaction>[] {
  return rows
    .filter((r) => r['transaction remarks'] && r['transaction date'])
    .map((r) => {
      const amountKey = Object.keys(r).find(k => k.includes('amount')) ?? ''
      const amountStr = (r[amountKey] ?? '').toString().trim()
      const amount = parseAmount(amountStr)
      // ICICI marks debits with a Dr suffix or separate column
      const drCrKey = Object.keys(r).find(k => k.includes('dr/cr') || k.includes('cr/dr')) ?? ''
      const drCr = (r[drCrKey] ?? '').toString().toUpperCase()
      const isDebit = drCr.includes('DR') || drCr === 'D' || drCr.includes('DB')
      return {
        user_id: userId,
        date: normalizeDate(r['transaction date']),
        amount,
        type: isDebit ? 'debit' as const : 'credit' as const,
        raw_merchant: (r['transaction remarks'] ?? '').trim(),
      }
    })
    .filter((t) => t.amount! > 0)
}

function parseAxis(rows: Row[], userId: string): Partial<Transaction>[] {
  return rows
    .filter((r) => r['particulars'] && (r['tran date'] || r['transaction date']))
    .map((r) => {
      const debitKey = Object.keys(r).find(k => k.includes('debit')) ?? ''
      const creditKey = Object.keys(r).find(k => k.includes('credit')) ?? ''
      const debit = parseAmount(r[debitKey] ?? '')
      const credit = parseAmount(r[creditKey] ?? '')
      const isDebit = debit > 0
      const dateKey = r['tran date'] ? 'tran date' : 'transaction date'
      return {
        user_id: userId,
        date: normalizeDate(r[dateKey]),
        amount: isDebit ? debit : credit,
        type: isDebit ? 'debit' as const : 'credit' as const,
        raw_merchant: (r['particulars'] ?? '').trim(),
      }
    })
    .filter((t) => t.amount! > 0)
}

export function parseCSV(
  csvText: string,
  userId: string
): { transactions: Partial<Transaction>[]; bankFormat: BankFormat } {
  // Parse as array of arrays first to find the header row
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  })

  let headerRowIndex = -1
  let bankFormat: BankFormat = 'unknown'
  let headers: string[] = []

  // Scan the first 50 rows to find the actual table headers
  for (let i = 0; i < Math.min(result.data.length, 50); i++) {
    const row = result.data[i].map((c: any) => typeof c === 'string' ? c.trim() : '')
    const format = detectBank(row)
    if (format !== 'unknown') {
      headerRowIndex = i
      bankFormat = format
      // Lowercase headers for consistent mapping
      headers = row.map((h: string) => h.toLowerCase())
      break
    }
  }

  if (headerRowIndex === -1) {
    return { transactions: [], bankFormat: 'unknown' }
  }

  // Map subsequent rows to objects using the detected headers
  const rows: Row[] = []
  for (let i = headerRowIndex + 1; i < result.data.length; i++) {
    const rowArray = result.data[i]
    const rowObj: Row = {}
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) {
        rowObj[headers[j]] = rowArray[j]
      }
    }
    rows.push(rowObj)
  }

  let transactions: Partial<Transaction>[] = []
  if (bankFormat === 'hdfc') transactions = parseHDFC(rows, userId)
  else if (bankFormat === 'icici') transactions = parseICICI(rows, userId)
  else if (bankFormat === 'axis') transactions = parseAxis(rows, userId)

  return { transactions, bankFormat }
}
