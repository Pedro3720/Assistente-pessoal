"use client"

import { useDashboard } from "@/hooks/useDashboard"
import { Shield, Calendar, Wallet, Dumbbell, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { SemanaVisual } from "@/components/dashboard/SemanaVisual"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatarData(iso: string): string {
  const date = new Date(iso)
  const weekdays = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."]
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${weekdays[date.getDay()]}, ${day}/${month} · ${hours}:${minutes}`
}

const today = new Date()
const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite"

export default function Dashboard() {
  const { resumo } = useDashboard()

  const totalIncome = resumo.totalIncome
  const totalExpense = resumo.totalExpense
  const saldoMes = resumo.saldoMes
  const totalFinanceiro = totalIncome + totalExpense
  const saldoPct = totalIncome > 0 ? (saldoMes / totalIncome) * 100 : 0
  const pctReceitas = totalFinanceiro > 0 ? (totalIncome / totalFinanceiro) * 100 : 0
  const pctDespesas = totalFinanceiro > 0 ? (totalExpense / totalFinanceiro) * 100 : 0

  const chartData = [
    { name: "Receitas", value: totalIncome > 0 ? totalIncome : 1, color: "#16a34a" },
    { name: "Despesas", value: totalExpense > 0 ? totalExpense : 1, color: "#dc2626" },
  ]

  return (
    <div className="max-w-5xl space-y-10">

      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">{greeting} —</p>
        <h1
          className="text-4xl font-extrabold tracking-tighter text-foreground leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Seu Painel
        </h1>
      </div>

      {resumo.loading ? (
        <div className="flex items-center gap-3 py-16">
          <div className="h-5 w-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      ) : resumo.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {resumo.error}
        </div>
      ) : (
        <>
          {/* Semana Visual */}
          <div className="rounded-2xl border border-border bg-card px-4 py-2">
            <SemanaVisual />
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Senhas", value: resumo.tarefasPendentes, icon: Shield, href: "/senhas" },
              { label: "Eventos Hoje", value: resumo.eventosHoje, icon: Calendar, href: "/calendario" },
              {
                label: "Saldo do Mês",
                value: formatCurrency(saldoMes),
                icon: Wallet,
                href: "/financas",
                colored: saldoMes < 0,
              },
              { label: "Treinos", value: resumo.treinosMes, icon: Dumbbell, href: "/treinos" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-6 hover:border-foreground/20 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
                  </div>
                  <div>
                    <p
                      className="text-3xl font-bold tracking-tight leading-none"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{item.label}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Lower section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Próximos Eventos */}
            <div className="lg:col-span-3 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <h2
                  className="text-base font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Próximos Eventos
                </h2>
                <Link
                  href="/calendario"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {resumo.proximosEventos.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum evento próximo.</p>
                  </div>
                ) : (
                  resumo.proximosEventos.map((evento) => (
                    <div key={evento.id} className="px-6 py-4 flex items-center gap-4 hover:bg-accent/50 transition-colors">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: evento.color || "#0a0a0a" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evento.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatarData(evento.start_date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financeiro */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border">
                <h2
                  className="text-base font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Finanças
                </h2>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                <div className="relative h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={68}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span
                      className="text-2xl font-bold leading-none tracking-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {saldoPct.toFixed(0)}%
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1">saldo</span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                      <span className="text-xs text-muted-foreground">Receitas</span>
                    </div>
                    <span className="text-xs font-medium">
                      {formatCurrency(totalIncome)}
                      <span className="text-muted-foreground ml-1">({pctReceitas.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                      <span className="text-xs text-muted-foreground">Despesas</span>
                    </div>
                    <span className="text-xs font-medium">
                      {formatCurrency(totalExpense)}
                      <span className="text-muted-foreground ml-1">({pctDespesas.toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
