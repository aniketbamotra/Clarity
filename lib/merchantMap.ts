import { Category, MerchantRule } from '@/types'

export const merchantMap: Record<string, MerchantRule> = {
  // Food & Dining
  'zomato': { clean_name: 'Zomato', category: 'Food & Dining', emoji: '🍔' },
  'swiggy': { clean_name: 'Swiggy', category: 'Food & Dining', emoji: '🍱' },
  'starbucks': { clean_name: 'Starbucks', category: 'Food & Dining', emoji: '☕' },
  'dominos': { clean_name: "Domino's", category: 'Food & Dining', emoji: '🍕' },
  'mcdonalds': { clean_name: "McDonald's", category: 'Food & Dining', emoji: '🍟' },
  'mcdonald': { clean_name: "McDonald's", category: 'Food & Dining', emoji: '🍟' },
  'kfc': { clean_name: 'KFC', category: 'Food & Dining', emoji: '🍗' },
  'burger king': { clean_name: 'Burger King', category: 'Food & Dining', emoji: '🍔' },
  'blinkit': { clean_name: 'Blinkit', category: 'Food & Dining', emoji: '🛒' },
  'dunzo': { clean_name: 'Dunzo', category: 'Food & Dining', emoji: '🛵' },
  'zepto': { clean_name: 'Zepto', category: 'Food & Dining', emoji: '⚡' },
  'bigbasket': { clean_name: 'BigBasket', category: 'Food & Dining', emoji: '🥦' },
  'instamart': { clean_name: 'Swiggy Instamart', category: 'Food & Dining', emoji: '🥬' },

  // Transport
  'uber': { clean_name: 'Uber', category: 'Transport', emoji: '🚗' },
  'ola': { clean_name: 'Ola', category: 'Transport', emoji: '🚕' },
  'rapido': { clean_name: 'Rapido', category: 'Transport', emoji: '🛵' },
  'fastag': { clean_name: 'FASTag', category: 'Transport', emoji: '🛣️' },
  'namma metro': { clean_name: 'Namma Metro', category: 'Transport', emoji: '🚇' },
  'metro': { clean_name: 'Metro', category: 'Transport', emoji: '🚇' },

  'indigo': { clean_name: 'IndiGo', category: 'Travel', emoji: '✈️' },
  'spicejet': { clean_name: 'SpiceJet', category: 'Travel', emoji: '✈️' },
  'airindia': { clean_name: 'Air India', category: 'Travel', emoji: '✈️' },
  'air india': { clean_name: 'Air India', category: 'Travel', emoji: '✈️' },
  'makemytrip': { clean_name: 'MakeMyTrip', category: 'Travel', emoji: '🏨' },
  'goibibo': { clean_name: 'Goibibo', category: 'Travel', emoji: '🏨' },
  'oyo': { clean_name: 'OYO', category: 'Travel', emoji: '🏨' },
  'irctc': { clean_name: 'IRCTC', category: 'Travel', emoji: '🚂' },

  // Shopping
  'amazon': { clean_name: 'Amazon', category: 'Shopping', emoji: '📦' },
  'amazon pay': { clean_name: 'Amazon Pay', category: 'Shopping', emoji: '💳' },
  'flipkart': { clean_name: 'Flipkart', category: 'Shopping', emoji: '🛍️' },
  'myntra': { clean_name: 'Myntra', category: 'Shopping', emoji: '👗' },
  'nykaa': { clean_name: 'Nykaa', category: 'Shopping', emoji: '💄' },
  'meesho': { clean_name: 'Meesho', category: 'Shopping', emoji: '🛒' },
  'ajio': { clean_name: 'AJIO', category: 'Shopping', emoji: '👔' },
  'croma': { clean_name: 'Croma', category: 'Shopping', emoji: '📱' },
  'reliance': { clean_name: 'Reliance', category: 'Shopping', emoji: '🛒' },

  // Entertainment
  'netflix': { clean_name: 'Netflix', category: 'Entertainment', emoji: '🎬' },
  'spotify': { clean_name: 'Spotify', category: 'Entertainment', emoji: '🎵' },
  'hotstar': { clean_name: 'Hotstar', category: 'Entertainment', emoji: '📺' },
  'disney': { clean_name: 'Disney+', category: 'Entertainment', emoji: '🏰' },
  'youtube': { clean_name: 'YouTube Premium', category: 'Entertainment', emoji: '▶️' },
  'bookmyshow': { clean_name: 'BookMyShow', category: 'Entertainment', emoji: '🎟️' },
  'prime video': { clean_name: 'Prime Video', category: 'Entertainment', emoji: '🎞️' },
  'apple music': { clean_name: 'Apple Music', category: 'Entertainment', emoji: '🎵' },
  'apple media': { clean_name: 'Apple Services', category: 'Entertainment', emoji: '🍎' },
  'apple services': { clean_name: 'Apple Services', category: 'Entertainment', emoji: '🍎' },
  'google india digital': { clean_name: 'Google Play', category: 'Entertainment', emoji: '🎮' },

  // Utilities
  'bescom': { clean_name: 'BESCOM', category: 'Utilities', emoji: '⚡' },
  'tatapower': { clean_name: 'Tata Power', category: 'Utilities', emoji: '⚡' },
  'tata power': { clean_name: 'Tata Power', category: 'Utilities', emoji: '⚡' },
  'tp ach': { clean_name: 'Tata Power', category: 'Utilities', emoji: '⚡' },
  'airtel': { clean_name: 'Airtel', category: 'Utilities', emoji: '📱' },
  'bharti airtel': { clean_name: 'Airtel', category: 'Utilities', emoji: '📱' },
  'jio': { clean_name: 'Jio', category: 'Utilities', emoji: '📱' },
  'bsnl': { clean_name: 'BSNL', category: 'Utilities', emoji: '📞' },
  'vi ': { clean_name: 'Vi (Vodafone Idea)', category: 'Utilities', emoji: '📱' },
  'vodafone': { clean_name: 'Vodafone', category: 'Utilities', emoji: '📱' },
  'mahanagar gas': { clean_name: 'Mahanagar Gas', category: 'Utilities', emoji: '🔥' },
  'indane': { clean_name: 'Indane Gas', category: 'Utilities', emoji: '🔥' },
  'bbmp': { clean_name: 'BBMP', category: 'Utilities', emoji: '🏛️' },
  'urban company': { clean_name: 'Urban Company', category: 'Utilities', emoji: '🔧' },

  // Health
  'apollo': { clean_name: 'Apollo Pharmacy', category: 'Health', emoji: '💊' },
  'pharmeasy': { clean_name: 'PharmEasy', category: 'Health', emoji: '🏥' },
  'netmeds': { clean_name: 'Netmeds', category: 'Health', emoji: '💉' },
  '1mg': { clean_name: '1mg', category: 'Health', emoji: '💊' },
  'practo': { clean_name: 'Practo', category: 'Health', emoji: '🩺' },
  'cult.fit': { clean_name: 'Cult.fit', category: 'Health', emoji: '🏋️' },
  'cultfit': { clean_name: 'Cult.fit', category: 'Health', emoji: '🏋️' },

  // Investment / Finance
  'zerodha': { clean_name: 'Zerodha', category: 'Investment', emoji: '📈' },
  'groww': { clean_name: 'Groww', category: 'Investment', emoji: '📊' },
  'coin': { clean_name: 'Zerodha Coin', category: 'Investment', emoji: '💰' },
  'kuvera': { clean_name: 'Kuvera', category: 'Investment', emoji: '📊' },
  'paytm money': { clean_name: 'Paytm Money', category: 'Investment', emoji: '💹' },
  'lic': { clean_name: 'LIC', category: 'Investment', emoji: '🛡️' },

  // Rent
  'nobroker': { clean_name: 'NoBroker', category: 'Rent', emoji: '🏠' },
  'magicbricks': { clean_name: 'MagicBricks', category: 'Rent', emoji: '🏢' },
  'furlenco': { clean_name: 'Furlenco', category: 'Rent', emoji: '🛋️' },
  
  // Transfer / Other
  'cred club': { clean_name: 'CRED', category: 'Transfer', emoji: '💳' },
  'capgemini': { clean_name: 'Capgemini (Salary)', category: 'Transfer', emoji: '💼' },
  'razorpay': { clean_name: 'Razorpay', category: 'Other', emoji: '💸' },
  'payu': { clean_name: 'PayU', category: 'Other', emoji: '💸' },
  'cashfree': { clean_name: 'Cashfree', category: 'Other', emoji: '💸' },
  'poonawalla': { clean_name: 'Poonawalla Fincorp', category: 'Other', emoji: '🏦' },
}

export function lookupMerchant(rawMerchant: string): MerchantRule | null {
  const lower = rawMerchant.toLowerCase()
  for (const key of Object.keys(merchantMap)) {
    if (lower.includes(key)) {
      return merchantMap[key]
    }
  }
  return null
}
