'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus, X, TrendingUp, TrendingDown, Wallet, CreditCard, Trash2,
  ArrowUpRight, ArrowDownRight, Edit3, ChevronDown, Pencil,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react'
import { transactionService } from '@/lib/services/transactionService'
import { supabase } from '@/lib/supabaseClient'
import { InputValor } from '@/components/financas/InputValor'
import { ImportModal } from '@/components/financas/ImportModal'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const DEFAULT_ICONS: Record<string, string> = {
  Moradia: '🏠', Alimentação: '🍽️', Transporte: '🚗', Lazer: '🎮',
  Saúde: '🏥', Educação: '📚', Salário: '💼', Freelance: '💻',
  Investimentos: '📈', 'Outras Receitas': '💰', Outros: '📌',
  Assinaturas: '📱', Faculdade: '🎓', Academia: '💪', Viagem: '✈️',
}

const DEFAULT_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros']
const DEFAULT_RECEITA = ['Salário', 'Freelance', 'Investimentos', 'Outras Receitas']
const CARD_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316']

const norm = (res: any) => (Array.isArray(res) ? res : res?.data || [])

export default function FinancasPage() {
  /* ── data ── */
  const [transactions, setTransactions] = useState<any[]>([])
  const [banks, setBanks] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── transaction modal ── */
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<any>(null)
  const [formDesc, setFormDesc] = useState('')
  const [formAmt, setFormAmt] = useState('')
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formCat, setFormCat] = useState(DEFAULT_DESPESA[0])
  const [formBankId, setFormBankId] = useState<number | null>(null)
  const [formCardId, setFormCardId] = useState<number | null>(null)
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  /* ── new bank inline ── */
  const [showNewBank, setShowNewBank] = useState(false)
  const [newBankName, setNewBankName] = useState('')
  const [newBankIcon, setNewBankIcon] = useState('🏦')

  /* ── card modal ── */
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)
  const [cardName, setCardName] = useState('')
  const [cardBankId, setCardBankId] = useState<number | null>(null)
  const [cardLimit, setCardLimit] = useState('')
  const [cardClose, setCardClose] = useState('')
  const [cardDue, setCardDue] = useState('')
  const [cardColor, setCardColor] = useState(CARD_COLORS[0])
  const [savingCard, setSavingCard] = useState(false)

  /* ── custom categories ── */
  const [customDespesa, setCustomDespesa] = useState<string[]>([])
  const [customReceita, setCustomReceita] = useState<string[]>([])
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')

  /* ── filter ── */
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  /* ── month navigation ── */
  const [monthOffset, setMonthOffset] = useState(0)
  // import modal
  const [showImport, setShowImport] = useState(false)

  /* ── load custom categories from localStorage ── */
  useEffect(() => {
    try {
      setCustomDespesa(JSON.parse(localStorage.getItem('cats_despesa') || '[]'))
      setCustomReceita(JSON.parse(localStorage.getItem('cats_receita') || '[]'))
      setCustomIcons(JSON.parse(localStorage.getItem('cat_icons') || '{}'))
    } catch {}
  }, [])

  /* ── load data ── */
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [txRes, banksRes, cardsRes, invRes] = await Promise.all([
          transactionService.getAll(),
          supabase.from('banks').select('*').order('name'),
          supabase.from('credit_cards').select('*').order('name'),
          supabase.from('card_invoices').select('*').in('status', ['open', 'pending']),
        ])
        setTransactions(norm(txRes))
        setBanks(banksRes.data || [])
        setCards(cardsRes.data || [])
        setInvoices(invRes.data || [])
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ── ESC key ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowModal(false); setShowCardModal(false) }
    }
    if (showModal || showCardModal) {
      window.addEventListener('keydown', h)
      return () => window.removeEventListener('keydown', h)
    }
  }, [showModal, showCardModal])

  /* ── derived categories ── */
  const allDespesa = useMemo(() => [...DEFAULT_DESPESA, ...customDespesa], [customDespesa])
  const allReceita = useMemo(() => [...DEFAULT_RECEITA, ...customReceita], [customReceita])
  const allIcons = useMemo(() => ({ ...DEFAULT_ICONS, ...customIcons }), [customIcons])
  const currentCats = formType === 'income' ? allReceita : allDespesa

  useEffect(() => {
    const cats = formType === 'income' ? allReceita : allDespesa
    if (!cats.includes(formCat)) setFormCat(cats[0])
  }, [formType]) // eslint-disable-line

  useEffect(() => {
    if (formCardId) {
      const card = cards.find(c => c.id === formCardId)
      if (!card || card.bank_id !== formBankId) setFormCardId(null)
    }
  }, [formBankId]) // eslint-disable-line

  /* ── computed ── */

  /* mês selecionado */
  const selectedDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])
  const selectedYear = selectedDate.getFullYear()
  const selectedMonth = selectedDate.getMonth()
  const monthLabel = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  /* transações do mês selecionado */
  const monthTx = useMemo(
    () => transactions.filter(t => {
      if (!t.date) return false
      const d = new Date(t.date + 'T00:00:00')
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
    }),
    [transactions, selectedYear, selectedMonth]
  )

  /* stats calculados sobre o mês */
  const receitas = useMemo(
    () => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    [monthTx]
  )
  const despesas = useMemo(
    () => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    [monthTx]
  )
  const saldo = receitas - despesas

  /* saldo atual de cada banco = saldo inicial + TODAS as entradas − saídas (histórico completo) */
  const bankBalances = useMemo(() =>
    banks.reduce((acc, bank) => {
      const tx = transactions.filter(t => t.bank_id === bank.id)
      const inc = tx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const exp = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      acc[bank.id] = Number(bank.balance || 0) + inc - exp
      return acc
    }, {} as Record<number, number>),
  [banks, transactions])

  const faturasAbertas = useMemo(
    () => invoices.filter(i => i.status === 'open').reduce((s, i) => s + Number(i.amount), 0),
    [invoices]
  )
  const filteredTx = useMemo(
    () => filter === 'all' ? monthTx : monthTx.filter(t => t.type === filter),
    [monthTx, filter]
  )
  const sortedTx = useMemo(
    () => [...filteredTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredTx]
  )
  const expByCat = useMemo(() => {
    const g: Record<string, number> = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      g[t.category] = (g[t.category] || 0) + Number(t.amount)
    })
    return Object.entries(g).sort((a, b) => b[1] - a[1])
  }, [monthTx])

  const totalMov = receitas + despesas
  const incPct = totalMov > 0 ? (receitas / totalMov) * 100 : 0
  const expPct = totalMov > 0 ? (despesas / totalMov) * 100 : 0
  const availCards = cards.filter(c => c.bank_id === formBankId)

  /* ── refresh helpers ── */
  const refreshTx = useCallback(async () => {
    setTransactions(norm(await transactionService.getAll()))
  }, [])
  const refreshCards = useCallback(async () => {
    const { data } = await supabase.from('credit_cards').select('*').order('name')
    setCards(data || [])
  }, [])

  /* ── transaction handlers ── */
  const resetForm = useCallback(() => {
    setFormDesc(''); setFormAmt(''); setFormType('expense')
    setFormCat(DEFAULT_DESPESA[0]); setFormBankId(null)
    setFormCardId(null); setFormDate(new Date().toISOString().split('T')[0])
  }, [])

  const openNew = useCallback(() => { resetForm(); setEditingTx(null); setShowModal(true) }, [resetForm])
  const openEdit = useCallback((tx: any) => {
    setEditingTx(tx); setFormDesc(tx.description || ''); setFormAmt(String(tx.amount || ''))
    setFormType(tx.type || 'expense'); setFormCat(tx.category || DEFAULT_DESPESA[0])
    setFormBankId(tx.bank_id || null); setFormCardId(tx.card_id || null)
    setFormDate(tx.date?.split('T')[0] || new Date().toISOString().split('T')[0])
    setShowModal(true)
  }, [])

  const parseAmt = (v: string) => Number(v.replace(/\./g, '').replace(',', '.'))

  const handleSave = useCallback(async () => {
    if (!formDesc || !formAmt) return
    setSaving(true)
    try {
      const data = { description: formDesc, amount: parseAmt(formAmt), type: formType, category: formCat, bank_id: formBankId, card_id: formCardId, date: formDate }
      editingTx ? await transactionService.update(editingTx.id, data) : await transactionService.create(data)
      resetForm(); setEditingTx(null); setShowModal(false); await refreshTx()
    } catch (e: any) { setError(e?.message || 'Erro ao salvar') }
    finally { setSaving(false) }
  }, [formDesc, formAmt, formType, formCat, formBankId, formCardId, formDate, editingTx, resetForm, refreshTx])

  const handleDelete = useCallback(async (id: number) => {
    try { await transactionService.remove(id); await refreshTx() }
    catch (e: any) { setError(e?.message || 'Erro ao excluir') }
  }, [refreshTx])

  const handleAddBank = useCallback(async () => {
    if (!newBankName.trim()) return
    try {
      const { data, error } = await supabase.from('banks').insert({ name: newBankName.trim(), icon: newBankIcon, balance: 0 }).select().single()
      if (error) throw error
      if (data) { setBanks(p => [...p, data]); setFormBankId(data.id) }
      setNewBankName(''); setShowNewBank(false)
    } catch (e: any) { setError(e?.message || 'Erro ao criar conta') }
  }, [newBankName, newBankIcon])

  /* ── card handlers ── */
  const resetCardForm = useCallback(() => {
    setCardName(''); setCardBankId(null); setCardLimit(''); setCardClose(''); setCardDue(''); setCardColor(CARD_COLORS[0])
  }, [])

  const openNewCard = useCallback(() => { resetCardForm(); setEditingCard(null); setShowCardModal(true) }, [resetCardForm])
  const openEditCard = useCallback((card: any) => {
    setEditingCard(card); setCardName(card.name || ''); setCardBankId(card.bank_id || null)
    setCardLimit(card.limit ? String(card.limit) : '')
    setCardClose(card.closing_day ? String(card.closing_day) : '')
    setCardDue(card.due_day ? String(card.due_day) : '')
    setCardColor(card.color || CARD_COLORS[0])
    setShowCardModal(true)
  }, [])

  const handleSaveCard = useCallback(async () => {
    if (!cardName.trim()) return
    setSavingCard(true)
    try {
      const data = {
        name: cardName.trim(), bank_id: cardBankId,
        limit: parseFloat(cardLimit.replace(',', '.')) || 0,
        closing_day: parseInt(cardClose) || null,
        due_day: parseInt(cardDue) || null,
        color: cardColor,
      }
      if (editingCard) {
        const { error } = await supabase.from('credit_cards').update(data).eq('id', editingCard.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('credit_cards').insert(data)
        if (error) throw error
      }
      setShowCardModal(false); resetCardForm(); setEditingCard(null); await refreshCards()
    } catch (e: any) { setError(e?.message || 'Erro ao salvar cartão') }
    finally { setSavingCard(false) }
  }, [cardName, cardBankId, cardLimit, cardClose, cardDue, cardColor, editingCard, resetCardForm, refreshCards])

  const handleDeleteCard = useCallback(async (id: number) => {
    if (!confirm('Excluir este cartão permanentemente?')) return
    try {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id)
      if (error) throw error
      await refreshCards()
    } catch (e: any) { setError(e?.message || 'Erro ao excluir cartão') }
  }, [refreshCards])

  /* ── category handlers ── */
  const handleAddCat = useCallback(() => {
    const name = newCatName.trim()
    if (!name) return
    const icon = newCatIcon || '📌'
    const icons = { ...customIcons, [name]: icon }
    setCustomIcons(icons); localStorage.setItem('cat_icons', JSON.stringify(icons))
    if (formType === 'expense') {
      const u = [...customDespesa, name]; setCustomDespesa(u); localStorage.setItem('cats_despesa', JSON.stringify(u))
    } else {
      const u = [...customReceita, name]; setCustomReceita(u); localStorage.setItem('cats_receita', JSON.stringify(u))
    }
    setFormCat(name); setNewCatName(''); setNewCatIcon('📌'); setShowAddCat(false)
  }, [newCatName, newCatIcon, formType, customDespesa, customReceita, customIcons])

  /* ── export CSV ── */
  const exportCSV = useCallback(() => {
    const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)', 'Conta', 'Cartão']
    const rows = sortedTx.map(tx => {
      const bank = banks.find(b => b.id === tx.bank_id)
      const card = cards.find(c => c.id === tx.card_id)
      return [
        tx.date ? new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR') : '',
        tx.description,
        tx.category,
        tx.type === 'income' ? 'Receita' : 'Despesa',
        Number(tx.amount).toFixed(2).replace('.', ','),
        bank?.name || '',
        card?.name || '',
      ]
    })
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${monthStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [sortedTx, banks, cards, selectedYear, selectedMonth])

  const handleDeleteCat = useCallback((name: string, type: 'income' | 'expense') => {
    if (type === 'expense') {
      const u = customDespesa.filter(c => c !== name); setCustomDespesa(u); localStorage.setItem('cats_despesa', JSON.stringify(u))
      if (formCat === name) setFormCat(DEFAULT_DESPESA[0])
    } else {
      const u = customReceita.filter(c => c !== name); setCustomReceita(u); localStorage.setItem('cats_receita', JSON.stringify(u))
      if (formCat === name) setFormCat(DEFAULT_RECEITA[0])
    }
  }, [customDespesa, customReceita, formCat])

  /* ── bulk import ── */
  const handleBulkImport = useCallback(async (rows: {
    description: string; amount: number; type: 'income' | 'expense'
    category: string; bank_id: number | null; date: string
  }[]) => {
    const { data, error } = await transactionService.bulkCreate(rows) as any
    if (error) throw new Error(error.message || 'Erro ao salvar no banco de dados')
    const saved = data || []
    setTransactions(prev => [...prev, ...saved])
  }, [])

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* error banner */}
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              Finanças
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Controle suas receitas, despesas e faturas</p>

            {/* month navigation */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setMonthOffset(o => o - 1)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium capitalize min-w-[9rem] text-center select-none">
                {monthLabel}
              </span>
              <button
                onClick={() => setMonthOffset(o => o + 1)}
                disabled={monthOffset >= 0}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {monthOffset !== 0 && (
                <button
                  onClick={() => setMonthOffset(0)}
                  className="text-xs text-primary hover:underline ml-1"
                >
                  Mês atual
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download className="h-4 w-4 rotate-180" />
              Importar Extrato
            </button>
            <button
              onClick={exportCSV}
              disabled={sortedTx.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              title={`Exportar ${sortedTx.length} transações como CSV`}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nova Transação
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Saldo Total', val: saldo, icon: Wallet, color: saldo >= 0 ? 'green' : 'red' },
            { label: 'Entradas', val: receitas, icon: TrendingUp, color: 'green' },
            { label: 'Despesas', val: despesas, icon: TrendingDown, color: 'red' },
            { label: 'Faturas Abertas', val: faturasAbertas, icon: CreditCard, color: 'amber' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-2xl font-bold text-${color}-600`}>{fmt(val)}</p>
                </div>
                <div className={`rounded-full p-3 bg-${color}-100`}>
                  <Icon className={`h-5 w-5 text-${color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* bank balances — calculated from transactions */}
        {banks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {banks.map(bank => {
              const bal = bankBalances[bank.id] ?? 0
              return (
                <div key={bank.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{bank.icon}</span>
                    <span className="text-sm font-medium truncate">{bank.name}</span>
                  </div>
                  <p className={`text-lg font-bold ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(bal)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">saldo atual</p>
                </div>
              )
            })}
          </div>
        )}

        {/* main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* expense by category */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Despesas por categoria</h3>
            <div className="mt-4 space-y-4">
              {expByCat.length > 0 ? expByCat.map(([cat, amt]) => {
                const pct = despesas > 0 ? (amt / despesas) * 100 : 0
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{allIcons[cat] || '📌'}</span>
                        <span className="font-medium">{cat}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{fmt(amt)}</p>
                        <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-accent">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              }) : (
                <p className="text-center text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
              )}
            </div>
          </div>

          {/* credit cards */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Cartões de Crédito</h3>
              </div>
              <button
                onClick={openNewCard}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent transition-colors"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </button>
            </div>
            <div className="space-y-5">
              {cards.length > 0 ? cards.map(card => {
                const cardInv = invoices.filter(i => i.card_id === card.id && i.status === 'open')
                const invAmt = cardInv.reduce((s, i) => s + Number(i.amount), 0)
                const cardExp = transactions
                  .filter(t => t.card_id === card.id && t.type === 'expense')
                  .reduce((s, t) => s + Number(t.amount), 0)
                const usePct = card.limit ? Math.min((cardExp / card.limit) * 100, 100) : 0
                return (
                  <div key={card.id} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: card.color || '#3b82f6' }} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{card.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Fecha dia {card.closing_day || '-'} | Vence dia {card.due_day || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditCard(card)} className="rounded p-1.5 text-muted-foreground hover:bg-accent transition-colors" title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCard(card.id)} className="rounded p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fatura aberta</span>
                      <span className={`font-semibold ${invAmt > 0 ? 'text-amber-500' : 'text-green-500'}`}>{fmt(invAmt)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-accent">
                      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${usePct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{usePct.toFixed(0)}% utilizado</span>
                      <span>Limite: {fmt(card.limit || 0)}</span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-center text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
              )}
            </div>
          </div>

          {/* right column */}
          <div className="space-y-6">
            {/* donut chart */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Receitas vs Despesas</h3>
              <div className="relative mt-4 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-40 w-40">
                  <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-green-500" strokeDasharray={`${incPct} ${100 - incPct}`} strokeDashoffset="25" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-red-500" strokeDasharray={`${expPct} ${100 - expPct}`} strokeDashoffset={25 - incPct} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{incPct.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground">Receitas</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Receitas</span>
                  <span className="font-medium">{fmt(receitas)}</span>
                  <span className="text-xs text-muted-foreground">({incPct.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Despesas</span>
                  <span className="font-medium">{fmt(despesas)}</span>
                  <span className="text-xs text-muted-foreground">({expPct.toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            {/* transactions list */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold">Transações</h3>
                <div className="flex items-center gap-2">
                  {(['all', 'income', 'expense'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        filter === f ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/80'
                      }`}
                    >
                      {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {loading ? (
                  <p className="text-center text-sm text-muted-foreground">Carregando...</p>
                ) : sortedTx.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
                ) : sortedTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`rounded-full p-2 shrink-0 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'income'
                          ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                          : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {allIcons[tx.category] || '📌'} {tx.category} •{' '}
                          {tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                      </span>
                      <button onClick={() => openEdit(tx)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ TRANSACTION MODAL ════════════════ */}
      {showImport && (
        <ImportModal
          banks={banks}
          allDespesa={allDespesa}
          allReceita={allReceita}
          allIcons={allIcons}
          onClose={() => setShowImport(false)}
          onImport={handleBulkImport}
        />
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                {editingTx ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <div className="w-9" />
            </div>

            <div className="mt-6 space-y-4">
              {/* type toggle */}
              <div className="grid grid-cols-2 gap-2">
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      formType === t
                        ? t === 'expense'
                          ? 'border border-red-300 bg-red-50 text-red-600'
                          : 'border border-green-300 bg-green-50 text-green-700'
                        : 'border border-border bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {t === 'expense' ? 'Despesa' : 'Receita'}
                  </button>
                ))}
              </div>

              {/* description */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Ex: Salário mensal"
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>

              {/* amount */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Valor (R$)</label>
                <InputValor value={formAmt} onChange={setFormAmt} required />
              </div>

              {/* categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {currentCats.map(cat => {
                    const isCustom = (formType === 'expense' ? customDespesa : customReceita).includes(cat)
                    return (
                      <div key={cat} className="relative group">
                        <button
                          type="button"
                          onClick={() => setFormCat(cat)}
                          className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            formCat === cat
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-muted text-foreground hover:bg-accent'
                          }`}
                        >
                          <span>{allIcons[cat] || '📌'}</span>
                          <span className="truncate">{cat}</span>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCat(cat, formType)}
                            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* add category */}
                  {showAddCat ? (
                    <div className="col-span-2 flex gap-2">
                      <input
                        type="text"
                        value={newCatIcon}
                        onChange={e => setNewCatIcon(e.target.value)}
                        maxLength={2}
                        className="w-12 rounded-lg border border-border bg-muted px-2 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="📌"
                      />
                      <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Nome da categoria"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleAddCat()}
                        className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                      />
                      <button type="button" onClick={handleAddCat} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                        +
                      </button>
                      <button type="button" onClick={() => { setShowAddCat(false); setNewCatName('') }} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCat(true)}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Nova categoria
                    </button>
                  )}
                </div>
              </div>

              {/* bank account */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Conta</label>
                {showNewBank ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={newBankIcon} onChange={e => setNewBankIcon(e.target.value)} maxLength={2}
                        className="w-12 rounded-lg border border-border bg-muted px-2 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="🏦" />
                      <input type="text" value={newBankName} onChange={e => setNewBankName(e.target.value)} autoFocus
                        className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="Nome da conta" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleAddBank} disabled={!newBankName.trim()}
                        className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        Adicionar
                      </button>
                      <button type="button" onClick={() => { setShowNewBank(false); setNewBankName('') }}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <select value={formBankId ?? ''} onChange={e => setFormBankId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full appearance-none rounded-lg border border-border bg-muted px-3 py-2 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60">
                        <option value="">Selecione uma conta</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button type="button" onClick={() => setShowNewBank(true)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Plus className="h-4 w-4" />
                      Nova conta
                    </button>
                  </div>
                )}
              </div>

              {/* credit card (expense + bank only) */}
              {formType === 'expense' && formBankId && availCards.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Cartão de crédito</label>
                  <div className="relative">
                    <select value={formCardId ?? ''} onChange={e => setFormCardId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full appearance-none rounded-lg border border-border bg-muted px-3 py-2 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60">
                      <option value="">Sem cartão</option>
                      {availCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Data</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>

              <button type="button" onClick={handleSave} disabled={saving || !formDesc || !formAmt}
                className="mt-2 w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {saving ? 'Salvando...' : editingTx ? 'Salvar alterações' : 'Salvar transação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ CARD MODAL ════════════════ */}
      {showCardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowCardModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-popover p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <button onClick={() => setShowCardModal(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </h2>
              <div className="w-9" />
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Nome do cartão</label>
                <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} autoFocus
                  placeholder="Ex: Nubank Ultravioleta"
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Conta bancária</label>
                <div className="relative">
                  <select value={cardBankId ?? ''} onChange={e => setCardBankId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full appearance-none rounded-lg border border-border bg-muted px-3 py-2 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60">
                    <option value="">Sem conta vinculada</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Limite (R$)</label>
                <input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Dia de fechamento</label>
                  <input type="number" value={cardClose} onChange={e => setCardClose(e.target.value)}
                    placeholder="Ex: 10" min="1" max="31"
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Dia de vencimento</label>
                  <input type="number" value={cardDue} onChange={e => setCardDue(e.target.value)}
                    placeholder="Ex: 18" min="1" max="31"
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cor do cartão</label>
                <div className="flex flex-wrap gap-2">
                  {CARD_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setCardColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${cardColor === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleSaveCard} disabled={savingCard || !cardName.trim()}
                className="mt-2 w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {savingCard ? 'Salvando...' : editingCard ? 'Salvar alterações' : 'Criar cartão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
