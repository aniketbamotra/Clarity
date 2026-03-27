import { NextRequest, NextResponse } from 'next/server'
import { categorizeSync } from '@/lib/categorize'
import { cleanNarration } from '@/lib/csvParser'
import { supabase } from '@/lib/supabase'

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
    const { user_id, amount, type, narration, date } = body

    if (!user_id || !amount || !narration) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    let clean_merchant: string
    let category: string
    let category_source: string
    let confidence: string

    const result = categorizeSync(narration)
    if (result) {
      clean_merchant = result.clean_name
      category = result.category
      category_source = result.source
      confidence = result.confidence
    } else {
      const gemini = await callGemini(narration)
      if (gemini) {
        clean_merchant = gemini.clean_name
        category = gemini.category
      } else {
        clean_merchant = cleanNarration(narration)
        category = 'Other'
      }
      category_source = 'ai'
      confidence = 'low'
    }

    const { error } = await supabase.from('transactions').insert({
      user_id,
      date,
      amount,
      type,
      raw_merchant: narration,
      clean_merchant,
      category,
      category_source,
      confidence,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('parse-sms error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
