import { supabase } from '@/lib/supabaseClient'
import { executeQuery, ServiceResult } from './serviceResult'

export interface TransactionData {
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  bank_id?: number | null
  card_id?: number | null
}

export const transactionService = {
  getAll(): Promise<ServiceResult<any[]>> {
    return executeQuery(
      supabase.from('transactions').select('*').order('date', { ascending: false })
    )
  },

  getByMonth(year: number, month: number): Promise<ServiceResult<any[]>> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`
    return executeQuery(
      supabase.from('transactions').select('*')
        .gte('date', start).lt('date', end)
        .order('date', { ascending: false })
    )
  },

  create(data: TransactionData): Promise<ServiceResult<any>> {
    return executeQuery(
      supabase.from('transactions').insert(data).select().single()
    )
  },

  update(id: number, data: Partial<TransactionData>): Promise<ServiceResult<any>> {
    return executeQuery(
      supabase.from('transactions').update(data).eq('id', id).select().single()
    )
  },

  remove(id: number): Promise<ServiceResult<null>> {
    return executeQuery(
      supabase.from('transactions').delete().eq('id', id)
    )
  },

  bulkCreate(data: TransactionData[]): Promise<ServiceResult<any[]>> {
    return executeQuery(
      supabase.from('transactions').insert(data).select()
    )
  },
}
