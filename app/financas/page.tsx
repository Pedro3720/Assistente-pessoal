"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Plus, X, Wallet, TrendingUp, TrendingDown, PiggyBank,
  ArrowUpRight, ArrowDownRight, Edit3, Trash2, CreditCard,
  Building2, Calendar, Settings2,
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

interface UserCategory {
  id: number
  name: string
  icon: string
  color: string
  type: "income" | "expense" | "both"
}

// ===== CATEGORIAS PADRÃO (fixas) =====
const defaultCategories = [
  "Salário", "Freelance", "Investimentos", "Outras Receitas",
  "Moradia", "Alimentação", "Transporte", "Saúde",
  "Lazer", "Educação", "Cartão", "Assinaturas", "Outros",
]

const defaultCategoryIcons: Record<string, string> = {
  Moradia: "🏠", Alimentação: "🛒", Transporte: "🚗", Saúde: "💊",
  Lazer: "🎮", Educação: "📚", Cartão: "💳", Assinaturas: "📦",
  Outros: "📌", Salário: "💼", Freelance: "💻", Investimentos: "📈",
  "Outras Receitas": "💰",
}

const incomeOnly = ["Salário", "Freelance", "Investimentos", "Outras Receitas"]

const categoryColors: Record<string, string> = {
  Moradia: "#f97316", Alimentação: "#22c55e", Transporte: "#3b82f6",
  Saúde: "#ef4444", Lazer: "#8b5cf6", Educação: "#14b8a6",
  Cartão: "#ec4899", Assinaturas: "#f59e0b", Outros: "#6b7280",
  Salário: "#22c55e", Freelance: "#3b82f6", Investimentos: "#8b5cf6",
  "Outras Receitas": "#10b981",
}

const availableIcons = [
  "🏠", "🛒", "🚗", "💊", "🎮", "📚", "💳", "📦", "📌",
  "💼", "💻", "📈", "💰", "🐾", "💪", "🏋️", "🐶", "🐱",
  "✈️", "🎯", "🎵", "📱", "☕", "🍕", "🎬", "👕", "💄",
  "🛡️", "🔧", "📊", "🎓", "🏥", "⚽", "🎨", "🌿",
]

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export default function FinancasPage() {
  // ===== ESTADOS PRINCIPAIS =====
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [invoices, setInvoices] = useState<CardInvoice[]>([])
  const [userCategories, setUserCategories] = useState<UserCategory[]>([])
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

  // ===== ESTADOS PARA EDIÇÃO DE BANCOS =====
  const [showBankModal, setShowBankModal] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [formBankName, setFormBankName] = useState("")
  const [formBankBalance, setFormBankBalance] = useState("")
  const [formBankColor, setFormBankColor] = useState("#3b82f6")
  const [formBankIcon, setFormBankIcon] = useState("🏦")
  const [savingBank, setSavingBank] = useState(false)

  const bankIcons = ["🏦", "🏛️", "💰", "🏆", "💳", "🏅", "⭐", "🔵", "🟣", "🟠", "🟢", "🔴"]

  // ===== ESTADOS PARA EDIÇÃO DE CARTÕES =====
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [formCardName, setFormCardName] = useState("")
  const [formCardLimit, setFormCardLimit] = useState("")
  const [formCardClosing, setFormCardClosing] = useState("")
  const [formCardDue, setFormCardDue] = useState("")
  const [formCardColorEdit, setFormCardColorEdit] = useState("#3b82f6")
  const [savingCard, setSavingCard] = useState(false)

  // ===== ESTADOS PARA EDIÇÃO DE FATURAS =====
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<CardInvoice | null>(null)
  const [formInvoiceAmount, setFormInvoiceAmount] = useState("")
  const [formInvoiceStatus, setFormInvoiceStatus] = useState("open")
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [savingInvoice, setSavingInvoice] = useState(false)

  // ===== ESTADOS PARA CATEGORIAS PERSONALIZADAS =====
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null)
  const [formCatName, setFormCatName] = useState("")
  const [formCatIcon, setFormCatIcon] = useState("📌")
  const [formCatColor, setFormCatColor] = useState("#3b82f6")
  const [formCatType, setFormCatType] = useState<"income" | "expense" | "both">("expense")
  const [savingCategory, setSavingCategory] = useState(false)

  // ===== CATEGORIAS MESCLADAS (padrão + personalizadas) =====
  const allCategories = [
    ...defaultCategories,
    ...userCategories.map((c) => c.name),
  ]

  function getCategoryIcon(cat: string): string {
    if (defaultCategoryIcons[cat]) return defaultCategoryIcons[cat]
    const found = userCategories.find((c) => c.name === cat)
    return found ? found.icon : "📌"
  }

  function getCategoryColor(cat: string): string {
    if (categoryColors[cat]) return categoryColors[cat]
    const found = userCategories.find((c) => c.name === cat)
    return found ? found.color : "#6b7280"
  }

  // ===== FUNÇÕES DE FORMATAÇÃO =====
  function formatCurrencyInput(value: string): string {
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""
    const valor = parseInt(numbers, 10) / 100
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  function parseCurrencyInput(value: string): number {
    return parseFloat(value.replace(/\./g, "").replace(",", "."))
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [txRes, bankRes, cardRes, invRes, catRes] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }).order("id", { ascending: false }),
      supabase.from("bank_accounts").select("*").order("id"),
      supabase.from("credit_cards").select("*").order("id"),
      supabase.from("card_invoices").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("user_categories").select("*").order("id"),
    ])
    if (txRes.data) setTransactions(txRes.data as Transaction[])
    if (bankRes.data) setBanks(bankRes.data as BankAccount[])
    if (cardRes.data) setCards(cardRes.data as CreditCard[])
    if (invRes.data) setInvoices(invRes.data as CardInvoice[])
    if (catRes.data) setUserCategories(catRes.data as UserCategory[])
    setLoading(false)
  }

  // ===== FUNÇÕES DO MODAL DE TRANSAÇÕES =====
  function openModal(tx?: Transaction) {
    setEditingTx(tx || null)
    if (tx) {
      setFormDescription(tx.description)
      setFormAmount(formatCurrencyInput(String(tx.amount)))
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
    const amount = parseCurrencyInput(formAmount)
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
    setSaving(false)
    setShowModal(false)
    setEditingTx(null)
    loadAll()
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta transação?")) return
    await supabase.from("transactions").delete().eq("id", id)
    loadAll()
  }

  // ===== FUNÇÕES DO MODAL DE BANCOS =====
  function openBankModal(bank?: BankAccount) {
    setEditingBank(bank || null)
    if (bank) {
      setFormBankName(bank.name)
      setFormBankBalance(formatCurrencyInput(String(bank.balance)))
      setFormBankColor(bank.color)
      setFormBankIcon(bank.icon)
    } else {
      setFormBankName("")
      setFormBankBalance("")
      setFormBankColor("#3b82f6")
      setFormBankIcon("🏦")
    }
    setShowBankModal(true)
  }

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    if (!formBankName.trim() || !formBankBalance) return
    setSavingBank(true)
    const balance = parseCurrencyInput(formBankBalance)
    if (isNaN(balance)) return

    const payload = { name: formBankName.trim(), balance, color: formBankColor, icon: formBankIcon }

    if (editingBank) {
      await supabase.from("bank_accounts").update(payload).eq("id", editingBank.id)
    } else {
      await supabase.from("bank_accounts").insert(payload)
    }
    setSavingBank(false)
    setShowBankModal(false)
    setEditingBank(null)
    loadAll()
  }

  async function handleDeleteBank(id: number) {
    if (!confirm("Excluir esta conta bancária?")) return
    await supabase.from("bank_accounts").delete().eq("id", id)
    loadAll()
  }

  // ===== FUNÇÕES DO MODAL DE CARTÕES =====
  function openCardModal(card?: CreditCard) {
    setEditingCard(card || null)
    if (card) {
      setFormCardName(card.name)
      setFormCardLimit(formatCurrencyInput(String(card.limit_amount)))
      setFormCardClosing(String(card.closing_day))
      setFormCardDue(String(card.due_day))
      setFormCardColorEdit(card.color)
    } else {
      setFormCardName("")
      setFormCardLimit("")
      setFormCardClosing("")
      setFormCardDue("")
      setFormCardColorEdit("#3b82f6")
    }
    setShowCardModal(true)
  }

  async function handleSaveCard(e: React.FormEvent) {
    e.preventDefault()
    if (!formCardName.trim() || !formCardLimit || !formCardClosing || !formCardDue) return
    setSavingCard(true)
    const limit = parseCurrencyInput(formCardLimit)
    const closing = parseInt(formCardClosing)
    const due = parseInt(formCardDue)
    if (isNaN(limit) || isNaN(closing) || isNaN(due)) return

    const payload = { name: formCardName.trim(), limit_amount: limit, closing_day: closing, due_day: due, color: formCardColorEdit }

    if (editingCard) {
      await supabase.from("credit_cards").update(payload).eq("id", editingCard.id)
    } else {
      await supabase.from("credit_cards").insert({ ...payload, bank_id: null })
    }
    setSavingCard(false)
    setShowCardModal(false)
    setEditingCard(null)
    loadAll()
  }

  async function handleDeleteCard(id: number) {
    if (!confirm("Excluir este cartão de crédito?")) return
    await supabase.from("credit_cards").delete().eq("id", id)
    loadAll()
  }

  // ===== FUNÇÕES DO MODAL DE FATURAS =====
  function openInvoiceModal(invoice: CardInvoice, cardId: number) {
    setSelectedCardId(cardId)
    setEditingInvoice(invoice)
    setFormInvoiceAmount(formatCurrencyInput(String(invoice.amount)))
    setFormInvoiceStatus(invoice.status)
    setShowInvoiceModal(true)
  }

  function openNewInvoiceModal(cardId: number) {
    setSelectedCardId(cardId)
    setEditingInvoice(null)
    setFormInvoiceAmount("")
    setFormInvoiceStatus("open")
    setShowInvoiceModal(true)
  }

  async function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!formInvoiceAmount || !selectedCardId) return
    setSavingInvoice(true)
    const amount = parseCurrencyInput(formInvoiceAmount)
    if (isNaN(amount)) return

    const now = new Date()
    const payload = {
      card_id: selectedCardId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      amount,
      paid_amount: formInvoiceStatus === "paid" ? amount : 0,
      status: formInvoiceStatus,
      due_date: null,
    }

    if (editingInvoice) {
      await supabase.from("card_invoices").update(payload).eq("id", editingInvoice.id)
    } else {
      await supabase.from("card_invoices").insert(payload)
    }
    setSavingInvoice(false)
    setShowInvoiceModal(false)
    setEditingInvoice(null)
    setSelectedCardId(null)
    loadAll()
  }

  // ===== FUNÇÕES DO MODAL DE CATEGORIAS =====
  function openCategoryModal(cat?: UserCategory) {
    setEditingCategory(cat || null)
    if (cat) {
      setFormCatName(cat.name)
      setFormCatIcon(cat.icon)
      setFormCatColor(cat.color)
      setFormCatType(cat.type)
    } else {
      setFormCatName("")
      setFormCatIcon("📌")
      setFormCatColor("#3b82f6")
      setFormCatType("expense")
    }
    setShowCategoryModal(true)
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!formCatName.trim()) return
    // Verifica se já existe (padrão ou personalizada)
    if (defaultCategories.includes(formCatName.trim())) {
      alert("Essa categoria já existe como padrão!")
      return
    }
    setSavingCategory(true)

    const payload = {
      name: formCatName.trim(),
      icon: formCatIcon,
      color: formCatColor,
      type: formCatType,
    }

    if (editingCategory) {
      // Atualiza transações existentes com o novo nome se mudou
      await supabase.from("user_categories").update(payload).eq("id", editingCategory.id)
    } else {
      await supabase.from("user_categories").insert(payload)
    }
    setSavingCategory(false)
    setShowCategoryModal(false)
    setEditingCategory(null)
    loadAll()
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Excluir esta categoria? As transações com ela não serão removidas.")) return
    await supabase.from("user_categories").delete().eq("id", id)
    loadAll()
  }

  // ===== FILTROS E CÁLCULOS =====
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

      {/* Banner de Bancos (EDITÁVEL) */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Contas Bancárias</span>
          </div>
          <button onClick={() => openBankModal()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Nova Conta
          </button>
        </div>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {banks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum banco cadastrado.</p>
          ) : (
            banks.slice(0, 4).map((bank) => (
              <div key={bank.id} className="flex items-center gap-2 group">
                <span className="text-lg">{bank.icon}</span>
                <span className="text-sm text-muted-foreground">{bank.name}</span>
                <span className="text-sm font-semibold" style={{ color: bank.color }}>
                  {formatCurrency(bank.balance)}
                </span>
                <button onClick={() => openBankModal(bank)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-600 transition-all">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3 Colunas */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Despesas por Categoria */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Despesas por categoria</h2>
            <button onClick={() => openCategoryModal()}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Settings2 className="h-3 w-3" /> Gerenciar
            </button>
          </div>
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
                          <span className="text-lg">{getCategoryIcon(cat)}</span>
                          <span className="text-sm font-medium" style={{ color: getCategoryColor(cat) }}>
                            {cat}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(val)}</p>
                          <p className="text-xs text-muted-foreground">{pct}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-accent rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{
                          width: `${Math.min(parseFloat(pct), 100)}%`,
                          backgroundColor: getCategoryColor(cat),
                        }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Cartões de Crédito */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Cartões de Crédito</h2>
            </div>
            <button onClick={() => openCardModal()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Novo Cartão
            </button>
          </div>
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum cartão cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => {
                const cardInvoices = invoices.filter((i) => i.card_id === card.id && i.status === "open")
                const totalFatura = cardInvoices.reduce((a, i) => a + i.amount, 0)
                const usedPercent = card.limit_amount > 0 ? (totalFatura / card.limit_amount) * 100 : 0
                return (
                  <div key={card.id} className="border-b pb-3 last:border-0 last:pb-0 group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
                        <span className="text-sm font-medium">{card.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openCardModal(card)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-600 transition-all p-1">
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleDeleteCard(card.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all p-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fecho {card.closing_day}º | Vence {card.due_day}º</span>
                      <button onClick={() => openNewInvoiceModal(card.id)} className="text-blue-500 hover:text-blue-400 text-xs">
                        + Fatura
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Fatura atual</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-500">{formatCurrency(totalFatura)}</span>
                        {cardInvoices.length > 0 && (
                          <button onClick={() => openInvoiceModal(cardInvoices[0], card.id)}
                            className="text-muted-foreground hover:text-blue-600 transition-all">
                            <Edit3 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>Limite: {formatCurrency(card.limit_amount)}</span>
                      <span>{usedPercent.toFixed(0)}% utilizado</span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-1.5 mt-2">
                      <div className="h-1.5 rounded-full" style={{
                        width: `${Math.min(usedPercent, 100)}%`,
                        backgroundColor: usedPercent > 80 ? "#ef4444" : card.color,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Despesas por Categoria (lista) */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Todas as Categorias</h2>
            <button onClick={() => openCategoryModal()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Nova
            </button>
          </div>
          {allCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria.</p>
          ) : (
            <div className="space-y-2">
              {allCategories.map((cat) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(cat)}</span>
                    <span className="text-sm" style={{ color: getCategoryColor(cat) }}>{cat}</span>
                    {defaultCategories.includes(cat) ? (
                      <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">padrão</span>
                    ) : null}
                  </div>
                  {!defaultCategories.includes(cat) && (
                    <div className="flex gap-1">
                      <button onClick={() => {
                        const uc = userCategories.find((c) => c.name === cat)
                        if (uc) openCategoryModal(uc)
                      }} className="text-muted-foreground hover:text-blue-600 p-0.5">
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button onClick={async () => {
                        const uc = userCategories.find((c) => c.name === cat)
                        if (uc && confirm(`Excluir categoria "${cat}"?`)) {
                          await supabase.from("user_categories").delete().eq("id", uc.id)
                          loadAll()
                        }
                      }} className="text-muted-foreground hover:text-red-600 p-0.5">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"
                }`}>
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
                        <span style={{ color: getCategoryColor(tx.category) }}>{getCategoryIcon(tx.category)} {tx.category}</span>
                        {bank && <><span>•</span><span>{bank.icon} {bank.name}</span></>}
                        {card && <><span>•</span><span>💳 {card.name}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
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

      {/* ===== MODAL: NOVA TRANSAÇÃO ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <h2 className="text-sm font-semibold text-white">{editingTx ? "Editar Transação" : "Nova Transação"}</h2>
              <button onClick={handleSave} disabled={saving || !formDescription.trim() || !formAmount}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div className="flex rounded-lg bg-zinc-800 p-1">
                <button type="button" onClick={() => { setFormType("expense"); setFormCategory("Alimentação") }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    formType === "expense" ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:text-white"
                  }`}>
                  <TrendingDown className="h-4 w-4 inline mr-1.5" /> Despesa
                </button>
                <button type="button" onClick={() => { setFormType("income"); setFormCategory("Salário") }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    formType === "income" ? "bg-green-500/20 text-green-400" : "text-zinc-400 hover:text-white"
                  }`}>
                  <TrendingUp className="h-4 w-4 inline mr-1.5" /> Receita
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Descrição</label>
                <input type="text" placeholder="Ex: Salário mensal" value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Valor (R$)</label>
                <input type="text" placeholder="0,00" value={formAmount}
                  onChange={(e) => setFormAmount(formatCurrencyInput(e.target.value))}
                  className="w-full bg-zinc-800 text-white text-2xl font-bold rounded-lg px-3 py-3 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Categoria</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {(formType === "income"
                    ? allCategories.filter((c) => incomeOnly.includes(c) || userCategories.some((uc) => uc.name === c && (uc.type === "income" || uc.type === "both")))
                    : allCategories
                  ).map((cat) => (
                    <button key={cat} type="button" onClick={() => setFormCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                        formCategory === cat
                          ? "text-white border"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={formCategory === cat ? { borderColor: getCategoryColor(cat), backgroundColor: getCategoryColor(cat) + "30", color: getCategoryColor(cat) } : {}}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Conta</label>
                <select value={formBankId || ""} onChange={(e) => setFormBankId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500">
                  <option value="">Nenhuma</option>
                  {banks.map((b) => (<option key={b.id} value={b.id}>{b.icon} {b.name}</option>))}
                </select>
              </div>

              {formType === "expense" && formBankId && (
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Cartão de crédito</label>
                  <select value={formCardId || ""} onChange={(e) => setFormCardId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500">
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
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDITAR CONTA BANCÁRIA ===== */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowBankModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowBankModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <h2 className="text-sm font-semibold text-white">{editingBank ? "Editar Conta" : "Nova Conta"}</h2>
              <button onClick={handleSaveBank} disabled={savingBank || !formBankName.trim() || !formBankBalance}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed">
                {savingBank ? "Salvando..." : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Nome do Banco</label>
                <input type="text" placeholder="Ex: Nubank" value={formBankName} onChange={(e) => setFormBankName(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Saldo Atual (R$)</label>
                <input type="text" placeholder="0,00" value={formBankBalance}
                  onChange={(e) => setFormBankBalance(formatCurrencyInput(e.target.value))}
                  className="w-full bg-zinc-800 text-white text-lg font-bold rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {bankIcons.map((ico) => (
                    <button key={ico} type="button" onClick={() => setFormBankIcon(ico)}
                      className={`text-xl w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                        formBankIcon === ico ? "border-blue-500 bg-blue-500/20" : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                      }`}>{ico}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {["#8b5cf6", "#ef4444", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"].map((cor) => (
                    <button key={cor} type="button" onClick={() => setFormBankColor(cor)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formBankColor === cor ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: cor }} />
                  ))}
                </div>
              </div>
              {editingBank && (
                <button type="button" onClick={() => { handleDeleteBank(editingBank.id); setShowBankModal(false) }}
                  className="w-full text-xs text-red-400 hover:text-red-300 pt-2 border-t border-zinc-700 mt-2">
                  Excluir esta conta
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDITAR CARTÃO DE CRÉDITO ===== */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCardModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowCardModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <h2 className="text-sm font-semibold text-white">{editingCard ? "Editar Cartão" : "Novo Cartão"}</h2>
              <button onClick={handleSaveCard} disabled={savingCard || !formCardName.trim() || !formCardLimit}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed">
                {savingCard ? "Salvando..." : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSaveCard} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Nome do Cartão</label>
                <input type="text" placeholder="Ex: Nubank Ultravioleta" value={formCardName} onChange={(e) => setFormCardName(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Limite (R$)</label>
                  <input type="text" placeholder="0,00" value={formCardLimit} onChange={(e) => setFormCardLimit(formatCurrencyInput(e.target.value))}
                    className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Dia Fechamento</label>
                  <input type="number" min="1" max="31" placeholder="15" value={formCardClosing} onChange={(e) => setFormCardClosing(e.target.value)}
                    className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Dia Vencimento</label>
                  <input type="number" min="1" max="31" placeholder="22" value={formCardDue} onChange={(e) => setFormCardDue(e.target.value)}
                    className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Cor</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {["#8b5cf6", "#ef4444", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"].map((cor) => (
                      <button key={cor} type="button" onClick={() => setFormCardColorEdit(cor)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${formCardColorEdit === cor ? "border-white scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: cor }} />
                    ))}
                  </div>
                </div>
              </div>
              {editingCard && (
                <button type="button" onClick={() => { handleDeleteCard(editingCard.id); setShowCardModal(false) }}
                  className="w-full text-xs text-red-400 hover:text-red-300 pt-2 border-t border-zinc-700 mt-2">
                  Excluir este cartão
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDITAR FATURA ===== */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInvoiceModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowInvoiceModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <h2 className="text-sm font-semibold text-white">{editingInvoice ? "Editar Fatura" : "Nova Fatura"}</h2>
              <button onClick={handleSaveInvoice} disabled={savingInvoice || !formInvoiceAmount}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed">
                {savingInvoice ? "Salvando..." : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSaveInvoice} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Valor da Fatura (R$)</label>
                <input type="text" placeholder="0,00" value={formInvoiceAmount}
                  onChange={(e) => setFormInvoiceAmount(formatCurrencyInput(e.target.value))}
                  className="w-full bg-zinc-800 text-white text-2xl font-bold rounded-lg px-3 py-3 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Status</label>
                <div className="flex rounded-lg bg-zinc-800 p-1">
                  <button type="button" onClick={() => setFormInvoiceStatus("open")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      formInvoiceStatus === "open" ? "bg-orange-500/20 text-orange-400" : "text-zinc-400 hover:text-white"
                    }`}>Em aberto</button>
                  <button type="button" onClick={() => setFormInvoiceStatus("paid")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      formInvoiceStatus === "paid" ? "bg-green-500/20 text-green-400" : "text-zinc-400 hover:text-white"
                    }`}>Paga</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: CATEGORIAS PERSONALIZADAS ===== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCategoryModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowCategoryModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <h2 className="text-sm font-semibold text-white">{editingCategory ? "Editar Categoria" : "Nova Categoria"}</h2>
              <button onClick={handleSaveCategory} disabled={savingCategory || !formCatName.trim()}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-zinc-600 disabled:cursor-not-allowed">
                {savingCategory ? "Salvando..." : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Nome da Categoria</label>
                <input type="text" placeholder="Ex: Pet, Academia, Farmácia" value={formCatName}
                  onChange={(e) => setFormCatName(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 border border-zinc-700 outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Tipo</label>
                <div className="flex rounded-lg bg-zinc-800 p-1">
                  <button type="button" onClick={() => setFormCatType("expense")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      formCatType === "expense" ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:text-white"
                    }`}>Despesa</button>
                  <button type="button" onClick={() => setFormCatType("income")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      formCatType === "income" ? "bg-green-500/20 text-green-400" : "text-zinc-400 hover:text-white"
                    }`}>Receita</button>
                  <button type="button" onClick={() => setFormCatType("both")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      formCatType === "both" ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:text-white"
                    }`}>Ambos</button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Ícone</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {availableIcons.map((ico) => (
                    <button key={ico} type="button" onClick={() => setFormCatIcon(ico)}
                      className={`text-xl w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                        formCatIcon === ico ? "border-blue-500 bg-blue-500/20" : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                      }`}>{ico}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {["#8b5cf6", "#ef4444", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#f97316", "#6b7280", "#dc2626"].map((cor) => (
                    <button key={cor} type="button" onClick={() => setFormCatColor(cor)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formCatColor === cor ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: cor }} />
                  ))}
                </div>
              </div>

              {editingCategory && (
                <button type="button" onClick={() => { handleDeleteCategory(editingCategory.id); setShowCategoryModal(false) }}
                  className="w-full text-xs text-red-400 hover:text-red-300 pt-2 border-t border-zinc-700 mt-2">
                  Excluir esta categoria
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}