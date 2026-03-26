import { NextRequest, NextResponse } from 'next/server'
import { parseCSV } from '@/lib/csvParser'
import { categorizeSync } from '@/lib/categorize'
import { supabase } from '@/lib/supabase'
import { Transaction, Category } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    const csvText = await file.text()
    const { transactions, bankFormat } = parseCSV(csvText, userId)

    if (bankFormat === 'unknown') {
      return NextResponse.json(
        { error: 'Bank format not recognised. Please use HDFC, ICICI, or Axis Bank statements.' },
        { status: 422 }
      )
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found in the file.' }, { status: 422 })
    }

    // Categorise each transaction — use sync rule/heuristic first, then AI for unknowns
    const aiNeeded: number[] = []
    const enriched: Partial<Transaction>[] = transactions.map((t, i) => {
      const result = categorizeSync(t.raw_merchant ?? '')
      if (result) {
        return {
          ...t,
          clean_merchant: result.clean_name,
          category: result.category,
          category_source: result.source,
          confidence: result.confidence,
        }
      }
      aiNeeded.push(i)
      return { ...t, clean_merchant: t.raw_merchant, category: 'Other' as Category, category_source: 'ai', confidence: 'low' }
    })

    // Call Gemini for remaining unknowns (batch with sequential calls to avoid rate limits)
    if (aiNeeded.length > 0) {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY
      if (GEMINI_API_KEY) {
        for (const idx of aiNeeded.slice(0, 50)) { // cap at 50 AI calls per upload
          const raw = enriched[idx].raw_merchant ?? ''
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `You are a financial transaction categorizer for Indian users.\nGiven a raw merchant string from a bank statement, return ONLY a JSON object with:\n- category: one of ["Food & Dining", "Transport", "Shopping", "Entertainment", "Utilities", "Health", "Travel", "Rent", "Transfer", "Investment", "Other"]\n- clean_name: a readable merchant name (max 3 words)\n- emoji: one relevant emoji\n\nRaw merchant: ${raw}\n\nRespond with valid JSON only. No explanation.`,
                    }],
                  }],
                  generationConfig: { temperature: 0.1 },
                }),
              }
            )
            if (geminiRes.ok) {
              const geminiData = await geminiRes.json()
              const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                enriched[idx] = {
                  ...enriched[idx],
                  clean_merchant: parsed.clean_name ?? raw,
                  category: parsed.category ?? 'Other',
                }
              }
            }
          } catch {
            // keep 'Other' fallback
          }
        }
      }
    }

    // Bulk insert into Supabase
    const rows = enriched.map((t) => ({
      user_id: t.user_id,
      date: t.date,
      amount: t.amount,
      type: t.type,
      raw_merchant: t.raw_merchant,
      clean_merchant: t.clean_merchant ?? t.raw_merchant,
      category: t.category ?? 'Other',
      category_source: t.category_source ?? 'ai',
      confidence: t.confidence ?? 'low',
    }))

    const { data, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save transactions.' }, { status: 500 })
    }

    return NextResponse.json({ transactions: data, bankFormat })
  } catch (err) {
    console.error('parse-csv error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
