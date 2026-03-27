import { NextRequest, NextResponse } from 'next/server'
import { categorizeSync } from '@/lib/categorize'
import { cleanNarration } from '@/lib/csvParser'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'

type IncomingTransaction = {
  user_id: string
  amount: number
  type: 'debit' | 'credit'
  narration: string
  date: string
}

const GEMINI_PROMPT = (raw: string) =>
  `You are a financial transaction categorizer for Indian users.\nGiven a raw merchant string from a bank statement, return ONLY a JSON object with:\n- category: one of ["Food & Dining", "Transport", "Shopping", "Entertainment", "Utilities", "Health", "Travel", "Rent", "Transfer", "Investment", "Other"]\n- clean_name: a readable merchant name (max 3 words)\n- emoji: one relevant emoji\n\nRaw merchant: ${raw}\n\nRespond with valid JSON only. No explanation.`

async function callGemini(raw: string): Promise<{ clean_name: string; category: string } | null> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: GEMINI_PROMPT(raw) }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    return { clean_name: parsed.clean_name ?? raw, category: parsed.category ?? 'Other' }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transactions, user_id } = body as { transactions: IncomingTransaction[]; user_id: string }

    if (!user_id || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Pass 1: rule-based + P2P heuristic
    const aiNeeded: number[] = []
    const rows = transactions.map((tx, i) => {
      const result = categorizeSync(tx.narration)
      if (result) {
        return {
          user_id,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          raw_merchant: tx.narration,
          clean_merchant: result.clean_name,
          category: result.category as Category,
          category_source: result.source,
          confidence: result.confidence,
        }
      }
      aiNeeded.push(i)
      return {
        user_id,
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        raw_merchant: tx.narration,
        clean_merchant: cleanNarration(tx.narration),
        category: 'Other' as Category,
        category_source: 'ai',
        confidence: 'low',
      }
    })

    // Pass 2: Gemini for unknowns (cap at 50 per batch)
    for (const idx of aiNeeded.slice(0, 50)) {
      const gemini = await callGemini(transactions[idx].narration)
      if (gemini) {
        rows[idx].clean_merchant = gemini.clean_name
        rows[idx].category = gemini.category as Category
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, inserted: data?.length ?? rows.length })
  } catch (err) {
    console.error('parse-sms-batch error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
