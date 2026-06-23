"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  CheckSquare, Calendar, Wallet, Dumbbell, Clock,
  TrendingUp, TrendingDown, PiggyBank
} from "lucide-react"
import Link from "next/link"
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts"

interface Evento {
  id: number
  title: string
  start_date: string
  color: string | null
}

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
}

interface Resumo {
  tarefasPendentes: number
  eventosHoje: number
  saldoMes: number
  treinosMes: number
  proximosEventos: Evento[]
  totalIncome: number
  totalExpense: number
  topDespesas: { category: string; amount: number }[]
}

const categoryIcons: Record<string, string> = {
  Moradia: "🏠", Alimentação: "🛒", Transporte: "🚗", Saúde: "💊",
  Lazer: "🎮", Educação: "📚", Cartão: "💳", Assinaturas: "📦",
  Outros: "📌", Salário: "💼", Freelance: "💻", Investimentos: "📈",
  "Outras Receitas": "💰",
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<Resumo>({
    tarefasPendentes: 0,
    eventosHoje: 0,
    saldoMes: 0,
    treinosMes: 0,
    proximosEventos: [],
    totalIncome: 0,
    totalExpense: 0,
    topDespesas: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarResumo()
  }, [])

  async function carregarResumo() {
    const hoje = new Date().toISOString().split("T")[0]
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    const inicioMes = primeiroDiaMes.toISOString().split("T")[0]

    const [
      { count: tarefas },
      { count: eventos },
      { count: treinos },
      { data: proximos },
      { data: transacoes }
    ] = await Promise.all([
      supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("events").select("*", { count: "exact", head: true })
        .gte("start_date", `${hoje}T00:00:00`).lte("start_date", `${hoje}T23:59:59`),
      supabase.from("events").select("*", { count: "exact", head: true })
        .eq("category", "Saúde").gte("start_date", `${inicioMes}T00:00:00`)
        .lte("start_date", `${hoje}T23:59:59`),
      supabase.from("events").select("id, title, start_date, color")
        .gte("start_date", `${hoje}T00:00:00`).order("start_date", { ascending: true }).limit(5),
      supabase.from("transactions").select("*")
        .gte("date", `${inicioMes}T00:00:00`)
        .lte("date", `${hoje}T23:59:59`),
    ])

    const txList = (transacoes as Transaction[]) || []

    const receitas = txList.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0)
    const despesas = txList.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0)
    const saldoReal = receitas - despesas

    const gastosPorCategoria: Record<string, number> = {}
    txList.filter(t => t.type === "expense").forEach(t => {
      gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + t.amount
    })
    const topDespesas = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    setResumo({
      tarefasPendentes: tarefas || 0,
      eventosHoje: eventos || 0,
      saldoMes: saldoReal,
      treinosMes: treinos || 0,
      proximosEventos: (proximos as Evento[]) || [],
      totalIncome: receitas,
      totalExpense: despesas,
      topDespesas,
    })
    setLoading(false)
  }

  function formatarData(data: string) {
    const d = new Date(data)
    return d.toLocaleDateString("pt-BR", {
      weekday: "short", day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const totalGeral = resumo.totalIncome + resumo.totalExpense
  const pctReceitas = totalGeral > 0 ? (resumo.totalIncome / totalGeral) * 100 : 0
  const pctDespesas = totalGeral > 0 ? (resumo.totalExpense / totalGeral) * 100 : 0
  const saldoPct = resumo.totalIncome > 0
    ? ((resumo.totalIncome - resumo.totalExpense) / resumo.totalIncome) * 100
    : 0

  const dataDonut = [
    { name: "Receitas", value: resumo.totalIncome },
    { name: "Despesas", value: resumo.totalExpense },
  ]

  const cards = [
    {
      title: "Tarefas Pendentes",
      value: String(resumo.tarefasPendentes),
      icon: CheckSquare, href: "/tarefas",
      color: "text-blue-600", bg: "bg-blue-50",
    },
    {
      title: "Eventos Hoje",
      value: String(resumo.eventosHoje),
      icon: Calendar, href: "/calendario",
      color: "text-green-600", bg: "bg-green-50",
    },
    {
      title: "Saldo do Mês",
      value: loading ? "..." : formatCurrency(resumo.saldoMes),
      icon: Wallet, href: "/financas",
      color: "text-emerald-600", bg: "bg-emerald-50",
    },
    {
      title: "Treinos no Mês",
      value: String(resumo.treinosMes),
      icon: Dumbbell, href: "/treinos",
      color: "text-orange-600", bg: "bg-orange-50",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumo da sua agenda e finanças</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? "..." : card.value}
                  </p>
                </div>
                <div className={`rounded-lg ${card.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Grid de 2 colunas: Receitas vs Despesas | Próximos Eventos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Receitas vs Despesas (Gráfico Donut) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Receitas vs Despesas</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          ) : totalGeral === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação no mês.
            </p>
          ) : (
            <>
              {/* Gráfico Donut */}
              <div className="flex justify-center mb-4">
                <div className="relative" style={{ width: 200, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataDonut}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground">
                      {saldoPct.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">saldo</span>
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Receitas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(resumo.totalIncome)}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{pctReceitas.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Despesas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(resumo.totalExpense)}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{pctDespesas.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Top Despesas */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Top despesas
                </h3>
                <div className="space-y-3">
                  {resumo.topDespesas.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{categoryIcons[item.category] || "📌"}</span>
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Próximos Eventos */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximos Eventos
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : resumo.proximosEventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento nos próximos dias.</p>
          ) : (
            <div className="space-y-4">
              {resumo.proximosEventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: evento.color || "#3b82f6" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{evento.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatarData(evento.start_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}