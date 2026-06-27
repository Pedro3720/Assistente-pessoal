import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import type { Transaction } from '@/types'

export function ResumoFinanceiro({ transactions }: { transactions: Transaction[] }) {
  const receitas = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const despesas = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const saldo = receitas - despesas

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
          <TrendingUp className="h-4 w-4" /> Receitas
        </div>
        <p className="text-2xl font-bold">
          {`R$ ${receitas.toFixed(2)}`}
        </p>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
          <TrendingDown className="h-4 w-4" /> Despesas
        </div>
        <p className="text-2xl font-bold">
          {`R$ ${despesas.toFixed(2)}`}
        </p>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-primary font-medium mb-1">
          <Wallet className="h-4 w-4" /> Saldo
        </div>
        <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {`R$ ${saldo.toFixed(2)}`}
        </p>
      </div>
    </div>
  )
}