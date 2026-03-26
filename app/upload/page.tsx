'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const BANKS = [
  {
    name: 'HDFC Bank',
    icon: '🏦',
    steps: 'Log in → Go to Accounts → Download Statement → Select CSV format.',
  },
  {
    name: 'ICICI Bank',
    icon: '🏛️',
    steps: 'Log in → My Accounts → Account Statement → Export as CSV.',
  },
  {
    name: 'Axis Bank',
    icon: '🏧',
    steps: 'Log in → Accounts → Statement of Accounts → Download CSV.',
  },
]

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setError(null)
    setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const userId = crypto.randomUUID()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const res = await fetch('/api/parse-csv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Persist userId so the feed can use it
      localStorage.setItem('clarity_user_id', userId)
      router.push(`/${userId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col flex-1 px-5 py-10 fade-in">
      {/* Header */}
      <div className="mb-10 mt-4">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">✨</span>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent-light)' }}>
            Clarity
          </span>
        </div>
        <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>
          See where your<br />money goes
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Upload your bank statement CSV to get an instant breakdown of your spending.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => !loading && fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 mb-4"
        style={{
          minHeight: '200px',
          borderColor: isDragging ? 'var(--accent)' : file ? 'var(--credit)' : 'var(--border)',
          backgroundColor: isDragging ? 'rgba(124,106,255,0.06)' : file ? 'rgba(78,203,113,0.04)' : 'var(--bg-card)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1,2,3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full dot-${i}`}
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Analysing your transactions…
            </p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(78,203,113,0.15)' }}>
              ✅
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--credit)' }}>{file.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB · Tap to change
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              📄
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Drop your CSV here
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              or tap to browse
            </p>
          </div>
        )}
      </div>

      {/* Bank badge */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
        <p className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
          Supports HDFC · ICICI · Axis Bank
        </p>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--debit)', border: '1px solid rgba(255,107,107,0.2)' }}>
          {error}
        </div>
      )}

      {/* Upload CTA */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 mb-6"
        style={{
          backgroundColor: file && !loading ? 'var(--accent)' : 'var(--bg-elevated)',
          color: file && !loading ? '#fff' : 'var(--text-muted)',
          cursor: file && !loading ? 'pointer' : 'not-allowed',
          transform: file && !loading ? 'scale(1)' : 'scale(1)',
        }}
        onMouseEnter={(e) => { if (file && !loading) (e.currentTarget.style.backgroundColor = 'var(--accent-light)') }}
        onMouseLeave={(e) => { if (file && !loading) (e.currentTarget.style.backgroundColor = 'var(--accent)') }}
      >
        {loading ? 'Analysing…' : 'Analyse my spending →'}
      </button>

      {/* How to export — collapsible */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
      >
        <span className="text-sm font-medium">How do I export my bank statement?</span>
        <span className="text-lg transition-transform duration-200" style={{ transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ⌄
        </span>
      </button>

      {showInstructions && (
        <div className="mt-2 rounded-xl overflow-hidden fade-in" style={{ backgroundColor: 'var(--bg-card)' }}>
          {BANKS.map((bank, i) => (
            <div
              key={bank.name}
              className="px-4 py-4"
              style={{ borderBottom: i < BANKS.length - 1 ? `1px solid var(--border)` : 'none' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{bank.icon}</span>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{bank.name}</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{bank.steps}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="mt-auto pt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        🔒 Your data stays private. No login needed.
      </p>
    </main>
  )
}
