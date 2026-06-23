'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputValor } from './InputValor'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: {
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
  }) => Promise<boolean>
}

const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Salário', 'Freelance', 'Outros'
]

export function FormularioTransacao({ open, onClose, onSave }: Props) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState(CATEGORIAS[0])
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount) return

    setSaving(true)
    const ok = await onSave({
      description,
      amount: Number(amount),
      type,
      category,
      date: new Date().toISOString().split('T')[0]
    })
    setSaving(false)

    if (ok) {
      setDescription('')
      setAmount('')
      setType('expense')
      setCategory(CATEGORIAS[0])
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4">Nova Transação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm bg-background"
              placeholder="Ex: Almoço"
              required
            />
          </div>
          <div>
  <label className="text-sm font-medium">Valor</label>
  <InputValor value={amount} onChange={setAmount} required />
</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === 'expense'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === 'income'
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              Receita
            </button>
          </div>
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm bg-background"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </div>
    </div>
  )
}