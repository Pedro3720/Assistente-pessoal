export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: number
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  bank_id: number | null
  card_id: number | null
  created_at?: string
}

export interface TransactionFormData {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  bank_id?: number | null
}