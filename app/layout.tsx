import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Clarity — Understand your spending',
  description: 'Upload your bank statement and instantly see where your money goes. Supports HDFC, ICICI, and Axis Bank.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-[#0f0f14] text-white antialiased`}>
        <div className="min-h-screen flex flex-col items-center">
          <div className="w-full max-w-[430px] min-h-screen flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
