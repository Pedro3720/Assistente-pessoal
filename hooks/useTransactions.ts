'use client'

import { useState, useEffect, useCallback } from 'react'
import { transactionService } from '@/lib/services/transactionService'

export function useTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await transactionService.getAll()
    if (result.error) setError(result.error)
    if (result.data) setTransactions(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (data: any): Promise<boolean> => {
    const result = await transactionService.create(data)
    if (result.error) { setError(result.error); return false }
    if (result.data) setTransactions(prev => [result.data, ...prev])
    return true
  }, [])

  const remove = useCallback(async (id: number): Promise<boolean> => {
    const result = await transactionService.remove(id)
    if (result.error) { setError(result.error); return false }
    setTransactions(prev => prev.filter(t => t.id !== id))
    return true
  }, [])

  return { transactions, loading, error, refresh, add, remove }
}