'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTransactions } from '@/hooks/useTransactions'
import { ResumoFinanceiro } from '@/components/financas/ResumoFinanceiro'
import { ListaTransacoes } from '@/components/financas/ListaTransacoes'
import { FormularioTransacao } from '@/components/financas/FormularioTransacao'

export default function FinancasPage() {
  const { transactions, loading, error, refresh, remove, add } = useTransactions()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanças</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Transação
        </Button>
      </div>
      <ResumoFinanceiro transactions={transactions} />
      <ListaTransacoes
        transactions={transactions}
        loading={loading}
        error={error}
        onDelete={remove}
        onRetry={refresh}
      />
      <FormularioTransacao
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={add}
      />
    </div>
  )
}