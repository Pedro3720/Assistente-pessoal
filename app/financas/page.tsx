"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Plus, X, Wallet, TrendingUp, TrendingDown, PiggyBank,
  ArrowUpRight, ArrowDownRight, Edit3, Trash2, CreditCard,
  Building2, Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  bank_id: number | null
  card_id: number | null
}

interface BankAccount {
  id: number
  name: string
  balance: number
  color: string
  icon: string
}

interface CreditCard {
  id: number
  name: string
  bank_id: number | null
  limit_amount: number
  closing_day: number
  due_day: number
  color: string
}

interface CardInvoice {
  id: number
  card_id: number
  month: number
  year: number
  amount: number
  paid_amount: number
  status: string
  due_date: string | null
}

const categories = [
  "Salário", "Freelance", "Investimentos", "Outras Receitas",
  "Moradia", "Alimentação", "Transporte", "Saúde",
  "Lazer", "Educação", "Cartão", "Assinaturas", "Outros",
]

const categoryIcons: Record<string, string> = {
  Moradia: "🏠", Alimentação: "🛒", Transporte: "🚗", Saúde: "💊",
  Lazer: "🎮", Educação: "📚", Cartão: "💳", Assinaturas: "📦",
  Outros: "📌", Salário: "💼", Freelance: "💻", Investimentos: "📈",
  "Outras Receitas": "💰",
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export default function FinancasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [invoices, setInvoices] = useState<CardInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")

  const [formDescription, setFormDescription] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formType, setFormType] = useState<"income" | "expense">("expense")
  const [formCategory, setFormCategory] = useState("Alimentação")
  const [formDate, setFormDate] = useState("")
  const [formBankId, setFormBankId] = useState<number | null>(null)
  const [formCardId, setFormCardId] = useState<number | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [txRes, bankRes, cardRes, invRes] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }).order("id", { ascending: false }),
      supabase.from("bank_accounts").select("*").order("id"),
      supabase.from("credit_cards").select("*").order("id"),
      supabase.from("card_invoices").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
    ])
    if (txRes.data) setTransactions(txRes.data as Transaction[])
    if (bankRes.data) setBanks(bankRes.data as BankAccount[])
    if (cardRes.data) setCards(cardRes.data as CreditCard[])
    if (invRes.data) setInvoices(invRes.data as CardInvoice[])
    setLoading(false)
  }

  function openModal(tx?: Transaction) {
    setEditingTx(tx || null)
    if (tx) {
      setFormDescription(tx.description)
      setFormAmount(String(tx.amount))
      setFormType(tx.type)
      setFormCategory(tx.category)
      setFormDate(tx.date)
      setFormBankId(tx.bank_id)
      setFormCardId(tx.card_id)
    } else {
      setFormDescription("")
      setFormAmount("")
      setFormType("expense")
      setFormCategory("Alimentação")
      setFormDate(new Date().toISOString().split("T")[0])
      setFormBankId(null)
      setFormCardId(null)
    }
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formDescription.trim() || !formAmount) return
    setSaving(true)
    const amount = parseFloat(formAmount.replace(",", "."))
    if (isNaN(amount)) return

    const payload = {
      description: formDescription.trim(),
      amount,
      type: formType,
      category: formCategory,
      date: formDate,
      bank_id: formBankId || null,
      card_id: (formType === "expense" && formBankId) ? formCardId || null : null,
    }

    if (editingTx) {
      await supabase.from("transactions").update(payload).eq("id", editingTx.id)
    } else {
      await supabase.from("transactions").insert(payload)
    }

    setSaving(false); setShowModal(false); setEditingTx(null)
    loadAll()
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta transação?")) return
    await supabase.from("transactions").delete().eq("id", id)
    loadAll()
  }

  const filteredTx = transactions.filter((tx) => {
    if (filter === "income") return tx.type === "income"
    if (filter === "expense") return tx.type === "expense"
    return true
  })

  const totalIncome = transactions.filter((tx) => tx.type === "income").reduce((a, t) => a + t.amount, 0)
  const totalExpense = transactions.filter((tx) => tx.type === "expense").reduce((a, t) => a + t.amount, 0)
  const balance = totalIncome - totalExpense

  const openInvoices = invoices.filter((inv) => inv.status === "open")
  const totalOpenInvoices = openInvoices.reduce((a, i) => a + i.amount, 0)

  const expensesByCategory = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount
      return acc
    }, {} as Record<string, number>)

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  function formatDate(date: string) {
    return new Date(date + "T12:00:00").toLocaleDateString("pt-BR")
  }

  const totalTransactions = totalIncome + totalExpense

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanças</h1>
          <p className="text-muted-foreground">Controle suas receitas, despesas e faturas</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" /> Nova Transação
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
            <div className="rounded-lg bg-emerald-50 p-2">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Entradas</p>
            <div className="rounded-lg bg-green-50 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" /> <span>Total do período</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Despesas</p>
            <div className="rounded-lg bg-red-50 p-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
            <ArrowDownRight className="h-3 w-3" />
            <span>{totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}% da receita` : "Sem receitas"}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Faturas Abertas</p>
            <div className="rounded-lg bg-orange-50 p-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOpenInvoices)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
            <Calendar className="h-3 w-3" />
            <span>{openInvoices.length} fatura(s) em aberto</span>
          </div>
        </div>
      </div>

      {/* Banner de Bancos */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {banks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum banco cadastrado.</p>
          ) : (
            banks.slice(0, 4).map((bank) => (
              <div key={bank.id} className="flex items-center gap-2">
                <span className="text-lg">{bank.icon}</span>
                <span className="text-sm text-muted-foreground">{bank.name}</span>
                <span className="text-sm font-semibold" style={{ color: bank.color }}>
                  {formatCurrency(bank.balance)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3 Colunas: Categorias | Cartões | Gráfico */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Despesas por Categoria */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Despesas por categoria</h2>
          {Object.keys(expensesByCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, val]) => {
                  const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : "0"
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryIcons[cat] || "📌"}</span>
                          <span className="text-sm font-medium">{cat}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(val)}</p>
                          <p className="text-xs text-muted-foreground">{pct}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-accent rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Cartões de Crédito */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Cartões de Crédito</h2>
          </div>
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum cartão cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => {
                const cardInvoices = invoices.filter((i) => i.card_id === card.id)
                const openAmount = cardInvoices.filter((i) => i.status === "open").reduce((a, i) => a + i.amount, 0)
                const usedLimit = openAmount
                const usagePercent = card.limit_amount > 0 ? (usedLimit / card.limit_amount) * 100 : 0
                return (
                  <div key={card.id} className="p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: card.color }} />
                        <p className="text-sm font-medium">{card.name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Fecha dia {card.closing_day} | Vence dia {card.due_day}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Fatura aberta</span>
                      <span className={`text-sm font-semibold ${openAmount > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {formatCurrency(openAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.min(usagePercent, 100)}%`, backgroundColor: card.color }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{usagePercent.toFixed(0)}% utilizado</span>
                      <span className="text-[10px] text-muted-foreground">Limite: {formatCurrency(card.limit_amount)}</span>
                    </div>

                    {cardInvoices.filter((i) => i.status === "open").length > 0 && (
                      <div className="mt-2 space-y-1 pt-2 border-t border-border">
                        {cardInvoices.filter((i) => i.status === "open").map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {monthNames[inv.month - 1]}/{inv.year}
                              {inv.due_date && ` • Vence ${formatDate(inv.due_date)}`}
                            </span>
                            <span className="font-medium text-orange-600">{formatCurrency(inv.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Receitas vs Despesas */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Receitas vs Despesas</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação.</p>
          ) : (
            <div className="space-y-4">
              {/* Donut Chart */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    {totalTransactions > 0 && (
                      <>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                          strokeDasharray={`${(totalIncome / totalTransactions) * 100} ${100 - (totalIncome / totalTransactions) * 100}`}
                          strokeLinecap="round" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3"
                          strokeDasharray={`${(totalExpense / totalTransactions) * 100} ${100 - (totalExpense / totalTransactions) * 100}`}
                          strokeDashoffset={`${-(totalIncome / totalTransactions) * 100}`}
                          strokeLinecap="round" />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {totalIncome > 0 ? `${((1 - totalExpense / totalIncome) * 100).toFixed(0)}%` : "0%"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">saldo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Receitas</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(totalIncome)}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalTransactions > 0 ? `${((totalIncome / totalTransactions) * 100).toFixed(0)}%` : "0%"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Despesas</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(totalExpense)}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalTransactions > 0 ? `${((totalExpense / totalTransactions) * 100).toFixed(0)}%` : "0%"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top despesas */}
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Top despesas</p>
                {Object.entries(expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between text-xs py-1">
                      <span className="text-muted-foreground">{categoryIcons[cat] || "📌"} {cat}</span>
                      <span className="font-medium">{formatCurrency(val)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transações */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Transações</h2>
          <div className="flex gap-1">
            {(["all", "income", "expense"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"}`}>
                {f === "all" ? "Todas" : f === "income" ? "Receitas" : "Despesas"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : filteredTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
        ) : (
          <div className="space-y-1">
            {filteredTx.map((tx) => {
              const bank = banks.find((b) => b.id === tx.bank_id)
              const card = cards.find((c) => c.id === tx.card_id)
              return (
                <div key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`rounded-lg p-2 ${tx.type === "income" ? "bg-green-50" : "bg-red-50"}`}>
                      {tx.type === "income"
                        ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                        : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        {bank && <><span>•</span><span>{bank.icon} {bank.name}</span></>}
                        {card && <><span>•</span><span>💳 {card.name}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <button onClick={() => openModal(tx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-600 transition-all p-1">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(tx.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <h2 className="text-sm font-semibold text-white">{editingTx ? "Editar Transação" : "Nova Transação"}</h2>
              <button onClick={handleSave} disabled={saving || !formDescription.trim() || !formAmount}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium transition-colors">
                {saving ? "Salvando..." : editingTx ? "Atualizar" : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormType("expense")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formType === "expense" ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  <TrendingDown className="h-4 w-4 inline mr-1" /> Despesa
                </button>
                <button type="button" onClick={() => setFormType("income")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formType === "income" ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  <TrendingUp className="h-4 w-4 inline mr-1" /> Receita
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Descrição</label>
                <input type="text" placeholder="Ex: Salário mensal" value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Valor (R$)</label>
                <input type="text" placeholder="0,00" value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-2xl font-bold rounded-lg px-3 py-3 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Categoria</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {categories.filter((c) => {
                    if (formType === "income") return ["Salário", "Freelance", "Investimentos", "Outras Receitas"].includes(c)
                    return true
                  }).map((cat) => (
                    <button key={cat} type="button" onClick={() => setFormCategory(cat)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${formCategory === cat ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                      <span>{categoryIcons[cat] || "📌"}</span> {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Conta</label>
                <select value={formBankId || ""} onChange={(e) => setFormBankId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500">
                  <option value="">Nenhuma</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
              </div>
              {formType === "expense" && formBankId && (
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Cartão de crédito</label>
                  <select value={formCardId || ""} onChange={(e) => setFormCardId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500">
                    <option value="">Nenhum (dinheiro/débito)</option>
                    {cards.filter((c) => c.bank_id === formBankId || !formBankId).map((c) => (
                      <option key={c.id} value={c.id}>💳 {c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Data</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}