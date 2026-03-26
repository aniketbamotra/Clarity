'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Transaction, Category } from '@/types'

const CATEGORIES: { label: Category; emoji: string }[] = [
  { label: 'Food & Dining', emoji: '🍔' },
  { label: 'Transport', emoji: '🚗' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Entertainment', emoji: '🎬' },
  { label: 'Utilities', emoji: '⚡' },
  { label: 'Health', emoji: '💊' },
  { label: 'Travel', emoji: '✈️' },
  { label: 'Rent', emoji: '🏠' },
  { label: 'Transfer', emoji: '💸' },
  { label: 'Investment', emoji: '📈' },
  { label: 'Other', emoji: '💳' },
]

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const toDay = (d: Date) => d.toISOString().slice(0, 10)
  if (toDay(date) === toDay(today)) return 'Today'
  if (toDay(date) === toDay(yesterday)) return 'Yesterday'

  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatAmount(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl px-4 py-4 mb-3 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="w-11 h-11 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-2/3 rounded skeleton" />
        <div className="h-3 w-1/3 rounded skeleton" />
      </div>
      <div className="h-5 w-16 rounded skeleton" />
    </div>
  )
}

type GroupedTransactions = { date: string; items: Transaction[] }[]

function groupByDate(txns: Transaction[]): GroupedTransactions {
  const map: Record<string, Transaction[]> = {}
  for (const t of txns) {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

function getCategoryEmoji(category: Category): string {
  return CATEGORIES.find((c) => c.label === category)?.emoji ?? '💳'
}

// Bottom sheet for category correction
function BottomSheet({
  transaction,
  onClose,
  onCorrect,
}: {
  transaction: Transaction
  onClose: () => void
  onCorrect: (id: string, oldCat: Category, newCat: Category) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)

  const handleSelect = async (cat: Category) => {
    if (cat === transaction.category) { onClose(); return }
    setSaving(true)
    await onCorrect(transaction.id, transaction.category, cat)
    setSaving(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] rounded-t-3xl px-5 pt-5 pb-8 slide-up"
        style={{ backgroundColor: 'var(--bg-elevated)', transform: 'translateX(-50%)' }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'var(--border)' }} />

        <div className="mb-1">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Change category for</p>
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            {transaction.clean_merchant}
          </p>
        </div>

        <div className="h-px my-4" style={{ backgroundColor: 'var(--border)' }} />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = cat.label === transaction.category
            return (
              <button
                key={cat.label}
                onClick={() => !saving && handleSelect(cat.label)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {saving && (
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            Saving…
          </p>
        )}
      </div>
    </>
  )
}

// Transaction card
function TxnCard({
  txn,
  onTap,
}: {
  txn: Transaction
  onTap: (t: Transaction) => void
}) {
  const isLowConf = txn.confidence === 'low' && txn.category_source !== 'user'
  const isDebit = txn.type === 'debit'

  return (
    <button
      onClick={() => onTap(txn)}
      className="w-full rounded-2xl px-4 py-4 mb-2.5 flex items-center gap-3 text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        backgroundColor: isLowConf ? 'rgba(124,106,255,0.06)' : 'var(--bg-card)',
        border: isLowConf ? '1px solid rgba(124,106,255,0.15)' : '1px solid transparent',
      }}
    >
      {/* Emoji icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        {getCategoryEmoji(txn.category)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {txn.clean_merchant}
          </p>
          {isLowConf && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'rgba(124,106,255,0.15)', color: 'var(--accent-light)' }}
            >
              ?
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          {txn.category}
        </p>
      </div>

      {/* Amount */}
      <p
        className="font-bold text-sm flex-shrink-0"
        style={{ color: isDebit ? 'var(--debit)' : 'var(--credit)' }}
      >
        {isDebit ? '-' : '+'}{formatAmount(txn.amount)}
      </p>
    </button>
  )
}

export default function FeedPage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTransactions(data as Transaction[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleCorrect = async (id: string, oldCat: Category, newCat: Category) => {
    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => t.id === id ? { ...t, category: newCat, category_source: 'user', confidence: 'high' } : t)
    )
    await fetch('/api/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: id, user_id: userId, old_category: oldCat, new_category: newCat }),
    })
  }

  const monthDebits = transactions.filter((t) => {
    if (t.type !== 'debit') return false
    const now = new Date()
    const tDate = new Date(t.date)
    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
  })
  const totalSpend = monthDebits.reduce((sum, t) => sum + t.amount, 0)

  const grouped = groupByDate(transactions)

  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <main className="flex flex-col flex-1 fade-in">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-5 sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold tracking-tight text-base" style={{ color: 'var(--accent-light)' }}>
              Clarity
            </span>
          </div>
          <a
            href="/upload"
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            + New upload
          </a>
        </div>

        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{monthLabel}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold" style={{ color: 'var(--debit)' }}>
            {loading
              ? <span className="inline-block w-28 h-8 rounded skeleton align-middle" />
              : formatAmount(totalSpend)
            }
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>spent this month</p>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 px-4 pt-4 pb-24">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              No transactions found
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Try uploading your bank statement to get started.
            </p>
            <a
              href="/upload"
              className="px-5 py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              Upload statement →
            </a>
          </div>
        ) : (
          grouped.map(({ date, items }) => (
            <div key={date} className="mb-4">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {formatDateLabel(date)}
                </p>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {items.filter((t) => t.type === 'debit').length} txn
                </p>
              </div>

              {items.map((txn) => (
                <TxnCard key={txn.id} txn={txn} onTap={setSelectedTxn} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Bottom sheet */}
      {selectedTxn && (
        <BottomSheet
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onCorrect={handleCorrect}
        />
      )}
    </main>
  )
}
