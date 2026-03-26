export type Category =
  | 'Food & Dining'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Utilities'
  | 'Health'
  | 'Travel'
  | 'Rent'
  | 'Transfer'
  | 'Investment'
  | 'Other'

export type Transaction = {
  id: string
  user_id: string
  date: string
  amount: number
  type: 'debit' | 'credit'
  raw_merchant: string
  clean_merchant: string
  category: Category
  category_source: 'rule' | 'ai' | 'user'
  confidence: 'high' | 'low'
}

export type BankFormat = 'hdfc' | 'icici' | 'axis' | 'unknown'

export type MerchantRule = {
  clean_name: string
  category: Category
  emoji: string
}

export type CategorizeResult = {
  clean_name: string
  category: Category
  emoji: string
  source: 'rule' | 'ai'
  confidence: 'high' | 'low'
}
