import { CategorizeResult } from '@/types'
import { lookupMerchant } from './merchantMap'

const UPI_PATTERNS = [
  /^upi[-\/]/i,
  /^upi\s/i,
  /@[a-zA-Z]+$/,  // UPI IDs
  /\d{10}/,       // phone numbers
]

function looksLikeUPITransfer(raw: string): boolean {
  return UPI_PATTERNS.some((p) => p.test(raw))
}

export async function categorize(raw_merchant: string): Promise<CategorizeResult> {
  // 1. Rule-based lookup
  const rule = lookupMerchant(raw_merchant)
  if (rule) {
    return {
      clean_name: rule.clean_name,
      category: rule.category,
      emoji: rule.emoji,
      source: 'rule',
      confidence: 'high',
    }
  }

  // 2. UPI person-to-person heuristic
  if (looksLikeUPITransfer(raw_merchant)) {
    const lower = raw_merchant.toLowerCase()
    const isBrandKeyword = ['pay', 'merchant', 'store', 'mart', 'shop', 'services', 'pvt', 'ltd', 'limited', 'limite', 'llp', 'fincorp', 'digital', 'company', 'solutions'].some(
      (kw) => lower.includes(kw)
    )
    if (!isBrandKeyword) {
      return {
        clean_name: raw_merchant,
        category: 'Transfer',
        emoji: '💸',
        source: 'rule',
        confidence: 'low',
      }
    }
  }

  // 3. AI fallback via /api/categorize
  try {
    const res = await fetch('/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_merchant }),
    })
    if (res.ok) {
      const data = await res.json()
      return {
        clean_name: data.clean_name ?? raw_merchant,
        category: data.category ?? 'Other',
        emoji: data.emoji ?? '💳',
        source: 'ai',
        confidence: 'low',
      }
    }
  } catch {
    // silently fall through
  }

  // 4. Ultimate fallback
  return {
    clean_name: raw_merchant,
    category: 'Other',
    emoji: '💳',
    source: 'ai',
    confidence: 'low',
  }
}

// Server-side version that calls Gemini directly (used in API route)
export function categorizeSync(raw_merchant: string): CategorizeResult | null {
  const rule = lookupMerchant(raw_merchant)
  if (rule) {
    return {
      clean_name: rule.clean_name,
      category: rule.category,
      emoji: rule.emoji,
      source: 'rule',
      confidence: 'high',
    }
  }

  if (looksLikeUPITransfer(raw_merchant)) {
    const lower = raw_merchant.toLowerCase()
    const isBrandKeyword = ['pay', 'merchant', 'store', 'mart', 'shop', 'services', 'pvt', 'ltd', 'limited', 'limite', 'llp', 'fincorp', 'digital', 'company', 'solutions'].some(
      (kw) => lower.includes(kw)
    )
    if (!isBrandKeyword) {
      return {
        clean_name: raw_merchant,
        category: 'Transfer',
        emoji: '💸',
        source: 'rule',
        confidence: 'low',
      }
    }
  }

  return null // signals caller to use Gemini
}
