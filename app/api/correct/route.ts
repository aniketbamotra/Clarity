import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, user_id, old_category, new_category } = await req.json()

    if (!transaction_id || !user_id || !new_category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert correction record
    const { error: correctionError } = await supabase.from('corrections').insert({
      transaction_id,
      user_id,
      old_category,
      new_category,
    })

    if (correctionError) {
      console.error('Correction insert error:', correctionError)
      return NextResponse.json({ error: 'Failed to save correction' }, { status: 500 })
    }

    // Update the transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ category: new_category, category_source: 'user' })
      .eq('id', transaction_id)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Transaction update error:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('correct error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
