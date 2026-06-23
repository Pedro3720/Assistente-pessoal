import { Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Props {
  transactions: any[]
  onDelete: (id: number) => void
  loading: boolean
  error: string | null
}

export function ListaTransacoes({ transactions, onDelete, loading, error }: Props) {
  if (loading) return <p className="text-muted-foreground text-center py-8">Carregando...</p>
  if (error) return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700 text-sm">
      Erro: {error}
    </div>
  )
  if (transactions.length === 0) return (
    <p className="text-muted-foreground text-center py-8">Nenhuma transação registrada.</p>
  )

  return (
    <div className="space-y-2">
      {transactions.map(t => (
        <div key={t.id} className="rounded-xl border bg-card p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {t.type === 'income'
              ? <ArrowUpRight className="h-5 w-5 text-green-500" />
              : <ArrowDownRight className="h-5 w-5 text-red-500" />
            }
            <div>
              <p className="font-medium">{t.description}</p>
              <p className="text-xs text-muted-foreground">{t.category} • {t.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {`R$ ${Number(t.amount).toFixed(2)}`}
            </span>
            <button onClick={() => onDelete(t.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}