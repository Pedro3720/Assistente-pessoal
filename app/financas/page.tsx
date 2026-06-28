'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Wallet, CreditCard, Trash2, PiggyBank, ArrowUpRight, ArrowDownRight, Building2, Landmark, MoreHorizontal, Edit3, ChevronDown, Banknote } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { transactionService } from '@/lib/services/transactionService'
import { supabase } from '@/lib/supabaseClient'
import { InputValor } from '@/components/financas/InputValor'
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
const categoryIcons: Record<string, string> = {
  Moradia: '🏠',
  Alimentação: '🍽️',
  Transporte: '🚗',
  Lazer: '🎮',
  Saúde: '🏥',
  Educação: '📚',
  Salário: '💼',
  Freelance: '💻',
  Investimentos: '📈',
  'Outras Receitas': '💰',
  Outros: '📌',
}
const CATEGORIAS_RECEITA = ['Salário', 'Freelance', 'Investimentos', 'Outras Receitas']
const CATEGORIAS_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros']
const ALL_CATEGORIES = [...CATEGORIAS_DESPESA, ...CATEGORIAS_RECEITA]
const normalizeData = (res: any) => {
  if (Array.isArray(res)) return res
  return res?.data || []
}
export default function FinancasPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<any | null>(null)
  const [banks, setBanks] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formCategory, setFormCategory] = useState(CATEGORIAS_DESPESA[0])
  const [formBankId, setFormBankId] = useState<number | null>(null)
  const [formCardId, setFormCardId] = useState<number | null>(null)
  const [showNewBankInput, setShowNewBankInput] = useState(false)
  const [newBankName, setNewBankName] = useState('')
  const [newBankIcon, setNewBankIcon] = useState('🏦')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const refreshTransactions = useCallback(async () => {
    const res = await transactionService.getAll()
    setTransactions(normalizeData(res))
  }, [])
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [txRes, banksRes, cardsRes, invoicesRes] = await Promise.all([
          transactionService.getAll(),
          supabase.from('banks').select('*').order('name'),
          supabase.from('credit_cards').select('*').order('name'),
          supabase.from('card_invoices').select('*').in('status', ['open', 'pending']),
        ])
        setTransactions(normalizeData(txRes))
        setBanks(banksRes.data || [])
        setCards(cardsRes.data || [])
        setInvoices(invoicesRes.data || [])
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  useEffect(() => {
    if (formType === 'income' && !CATEGORIAS_RECEITA.includes(formCategory)) {
      setFormCategory(CATEGORIAS_RECEITA[0])
    } else if (formType === 'expense' && !CATEGORIAS_DESPESA.includes(formCategory)) {
      setFormCategory(CATEGORIAS_DESPESA[0])
    }
  }, [formType, formCategory])
  useEffect(() => {
    if (formCardId) {
      const card = cards.find((c) => c.id === formCardId)
      if (!card || card.bank_id !== formBankId) {
        setFormCardId(null)
      }
    }
  }, [formBankId, formCardId, cards])
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    if (showModal) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal])
  const receitas = useMemo(() => {
    return transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0)
  }, [transactions])
  const despesas = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
  }, [transactions])
  const saldo = useMemo(() => receitas - despesas, [receitas, despesas])
  const filteredTx = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t) => t.type === filter)
  }, [transactions, filter])
  const totalExpenseByCategory = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense')
    const grouped: Record<string, number> = {}
    expenses.forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount)
    })
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])
  }, [transactions])
  const totalReceitas = receitas
  const totalDespesas = despesas
  const faturasAbertas = useMemo(() => {
    return invoices.filter((i) => i.status === 'open').reduce((acc, i) => acc + Number(i.amount), 0)
  }, [invoices])
  const totalMovimentacao = totalReceitas + totalDespesas
  const incomePercent = totalMovimentacao > 0 ? (totalReceitas / totalMovimentacao) * 100 : 0
  const expensePercent = totalMovimentacao > 0 ? (totalDespesas / totalMovimentacao) * 100 : 0
  const sortedFilteredTx = useMemo(() => {
    return [...filteredTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [filteredTx])
  const resetForm = useCallback(() => {
    setFormDescription('')
    setFormAmount('')
    setFormType('expense')
    setFormCategory(CATEGORIAS_DESPESA[0])
    setFormBankId(null)
    setFormCardId(null)
    setFormDate(new Date().toISOString().split('T')[0])
  }, [])
  const openNewTransaction = useCallback(() => {
    resetForm()
    setEditingTx(null)
    setShowModal(true)
  }, [resetForm])
  const openEdit = useCallback((tx: any) => {
    setEditingTx(tx)
    setFormDescription(tx.description || '')
    setFormAmount(tx.amount ? String(tx.amount) : '')
    setFormType(tx.type || 'expense')
    setFormCategory(tx.category || CATEGORIAS_DESPESA[0])
    setFormBankId(tx.bank_id || null)
    setFormCardId(tx.card_id || null)
    setFormDate(tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0])
    setShowModal(true)
  }, [])
  const handleAddBank = useCallback(async () => {
    if (!newBankName.trim()) return
    try {
      const { data, error } = await supabase
        .from('banks')
        .insert({ name: newBankName.trim(), icon: newBankIcon, balance: 0 })
        .select()
        .single()
      if (error) throw error
      if (data) {
        setBanks((prev) => [...prev, data])
        setFormBankId(data.id)
      }
      setNewBankName('')
      setShowNewBankInput(false)
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar conta')
    }
  }, [newBankName, newBankIcon])
  const parseAmount = (value: string) => {
    const cleaned = value.replace(/\./g, '').replace(',', '.')
    return Number(cleaned)
  }
  const handleSave = useCallback(async () => {
    if (!formDescription || !formAmount) return
    setSaving(true)
    try {
      const data = {
        description: formDescription,
        amount: parseAmount(formAmount),
        type: formType,
        category: formCategory,
        bank_id: formBankId,
        card_id: formCardId,
        date: formDate,
      }
      if (editingTx) {
        await transactionService.update(editingTx.id, data)
      } else {
        await transactionService.create(data)
      }
      resetForm()
      setEditingTx(null)
      setShowModal(false)
      await refreshTransactions()
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar transação')
    } finally {
      setSaving(false)
    }
  }, [formDescription, formAmount, formType, formCategory, formBankId, formCardId, formDate, editingTx, resetForm, refreshTransactions])
  const handleDelete = useCallback(async (id: number) => {
    try {
      await transactionService.remove(id)
      await refreshTransactions()
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir transação')
    }
  }, [refreshTransactions])
  const currentCategories = formType === 'income' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA
  const availableCards = cards.filter((c) => c.bank_id === formBankId)
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finanças</h1>
            <p className="text-muted-foreground">Controle suas receitas, despesas e faturas</p>
          </div>
          <button
            onClick={openNewTransaction}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova Transação
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                <p className={`mt-1 text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldo)}
                </p>
              </div>
              <div className={`rounded-full p-3 ${saldo >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Wallet className={`h-5 w-5 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(receitas)}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(despesas)}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faturas Abertas</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(faturasAbertas)}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        {banks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {banks.map((bank) => (
              <div key={bank.id} className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm">
                <span>{bank.icon}</span>
                <span className="font-medium">{bank.name}</span>
                <span className="text-muted-foreground">{formatCurrency(bank.balance || 0)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Despesas por categoria</h3>
            <div className="mt-4 space-y-4">
              {totalExpenseByCategory.length > 0 ? (
                totalExpenseByCategory.map(([category, amount]) => {
                  const percent = totalDespesas > 0 ? (amount / totalDespesas) * 100 : 0
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryIcons[category]}</span>
                          <span className="font-medium">{category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(amount)}</p>
                          <p className="text-xs text-muted-foreground">{percent.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-accent">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Cartões de Crédito</h3>
            </div>
            <div className="mt-4 space-y-6">
              {cards.length > 0 ? (
                cards.map((card) => {
                  const cardInvoices = invoices.filter((i) => i.card_id === card.id && i.status === 'open')
                  const invoiceAmount = cardInvoices.reduce((acc, i) => acc + Number(i.amount), 0)
                  const cardExpenses = transactions
                    .filter((t) => t.card_id === card.id && t.type === 'expense')
                    .reduce((acc, t) => acc + Number(t.amount), 0)
                  const usagePercent = card.limit ? Math.min((cardExpenses / card.limit) * 100, 100) : 0
                  return (
                    <div key={card.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: card.color }} />
                        <div>
                          <p className="font-medium">{card.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Fecha dia {card.closing_day || '-'} | Vence dia {card.due_day || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fatura aberta</span>
                        <span className={`font-semibold ${invoiceAmount > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                          {formatCurrency(invoiceAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{usagePercent.toFixed(0)}% utilizado</span>
                        <span>Limite: {formatCurrency(card.limit || 0)}</span>
                      </div>
                      {cardInvoices.length > 0 && (
                        <div className="border-t pt-3 space-y-2">
                          {cardInvoices.map((invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{invoice.month || 'Fatura atual'}</span>
                              <span>{formatCurrency(invoice.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Receitas vs Despesas</h3>
              <div className="relative mt-4 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-40 w-40">
                  <path
                    className="text-gray-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-green-500"
                    strokeDasharray={`${incomePercent} ${100 - incomePercent}`}
                    strokeDashoffset="25"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-red-500"
                    strokeDasharray={`${expensePercent} ${100 - expensePercent}`}
                    strokeDashoffset={25 - incomePercent}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{incomePercent.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground">Receitas</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Receitas</span>
                  <span className="font-medium">{formatCurrency(totalReceitas)}</span>
                  <span className="text-xs text-muted-foreground">({incomePercent.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Despesas</span>
                  <span className="font-medium">{formatCurrency(totalDespesas)}</span>
                  <span className="text-xs text-muted-foreground">({expensePercent.toFixed(0)}%)</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold">Transações</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilter('income')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filter === 'income' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                  >
                    Receitas
                  </button>
                  <button
                    onClick={() => setFilter('expense')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filter === 'expense' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                  >
                    Despesas
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {loading ? (
                  <p className="text-center text-sm text-muted-foreground">Carregando...</p>
                ) : sortedFilteredTx.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
                ) : (
                  sortedFilteredTx.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryIcons[tx.category] || '📌'} {tx.category} •{' '}
                            {tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(Number(tx.amount))}
                        </span>
                        <button
                          onClick={() => openEdit(tx)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-700 pb-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {editingTx ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <div className="w-9" />
            </div>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    formType === 'expense'
                      ? 'border border-red-500/50 bg-red-500/20 text-red-400'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    formType === 'income'
                      ? 'border border-green-500/50 bg-green-500/20 text-green-400'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Receita
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Descrição</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Salário mensal"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Valor (R$)</label>
                <InputValor value={formAmount} onChange={setFormAmount} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {currentCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        formCategory === cat
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <span>{categoryIcons[cat] || '📌'}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Conta</label>
                {showNewBankInput ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBankIcon}
                        onChange={(e) => setNewBankIcon(e.target.value)}
                        className="w-12 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="🏦"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nome da conta"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddBank}
                        disabled={!newBankName.trim()}
                        className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewBankInput(false)
                          setNewBankName('')
                        }}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formBankId ?? ''}
                      onChange={(e) => setFormBankId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecione uma conta</option>
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.icon} {bank.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <button
                      type="button"
                      onClick={() => setShowNewBankInput(true)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-600 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Nova conta
                    </button>
                  </div>
                )}
              </div>
              {formType === 'expense' && formBankId && availableCards.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-300">Cartão de crédito</label>
                  <div className="relative">
                    <select
                      value={formCardId ?? ''}
                      onChange={(e) => setFormCardId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sem cartão</option>
                      {availableCards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Data</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !formDescription || !formAmount}
                className="mt-2 w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingTx ? 'Salvar alterações' : 'Salvar transação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}