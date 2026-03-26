import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { raw_merchant } = await req.json()
    if (!raw_merchant) {
      return NextResponse.json({ error: 'raw_merchant is required' }, { status: 400 })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ category: 'Other', clean_name: raw_merchant, emoji: '💳' })
    }

    const prompt = `You are a financial transaction categorizer for Indian users.
Given a raw merchant string from a bank statement, return ONLY a JSON object with:
- category: one of ["Food & Dining", "Transport", "Shopping", "Entertainment", "Utilities", "Health", "Travel", "Rent", "Transfer", "Investment", "Other"]
- clean_name: a readable merchant name (max 3 words)
- emoji: one relevant emoji

Raw merchant: ${raw_merchant}

Respond with valid JSON only. No explanation.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ category: 'Other', clean_name: raw_merchant, emoji: '💳' })
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ category: 'Other', clean_name: raw_merchant, emoji: '💳' })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      category: parsed.category ?? 'Other',
      clean_name: parsed.clean_name ?? raw_merchant,
      emoji: parsed.emoji ?? '💳',
    })
  } catch (err) {
    console.error('categorize error:', err)
    return NextResponse.json({ category: 'Other', clean_name: 'Unknown', emoji: '💳' })
  }
}
