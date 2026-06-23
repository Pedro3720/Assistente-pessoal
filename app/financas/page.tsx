'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTransactions } from '@/hooks/useTransactions'
import { ResumoFinanceiro } from '@/components/financas/ResumoFinanceiro'
import { ListaTransacoes } from '@/components/financas/ListaTransacoes'

export default function FinancasPage() {
  const { transactions, loading, error, remove } = useTransactions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanças</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="h-4 w-4 mr-2" /> Nova Transação
        </Button>
      </div>
      <ResumoFinanceiro transactions={transactions} />
      <ListaTransacoes
        transactions={transactions}
        onDelete={remove}
        loading={loading}
        error={error}
      />
    </div>
  )
}