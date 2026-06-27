"use client"

import { useDashboard } from "@/hooks/useDashboard"
import {
  Shield,
  Calendar,
  Wallet,
  Dumbbell,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatarData(iso: string): string {
  const date = new Date(iso)
  const weekdays = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."]
  const weekday = weekdays[date.getDay()]
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${weekday}, ${day}/${month}, ${hours}:${minutes}`
}

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
    { name: "Receitas", value: totalIncome > 0 ? totalIncome : 1, color: "#22c55e" },
    { name: "Despesas", value: totalExpense > 0 ? totalExpense : 1, color: "#ef4444" },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumo da sua agenda e finanças</p>
        </div>
      </div>

      {/* LOADING */}
      {resumo.loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : resumo.error ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-red-500">Erro ao carregar: {resumo.error}</p>
        </div>
      ) : (
        <>
          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-muted-foreground">Senhas</p>
      <p className="text-3xl font-bold mt-1">{resumo.tarefasPendentes}</p>
    </div>
    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eventos Hoje</p>
                  <p className="text-3xl font-bold mt-1">{resumo.eventosHoje}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo do Mês</p>
                  <p className={`text-3xl font-bold mt-1 ${saldoMes >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(saldoMes)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Treinos no Mês</p>
                  <p className="text-3xl font-bold mt-1">{resumo.treinosMes}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Dumbbell className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* PRÓXIMOS EVENTOS + FINANCEIRO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PRÓXIMOS EVENTOS */}
            <div className="lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Próximos Eventos</h2>
              {resumo.proximosEventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento nos próximos dias.</p>
              ) : (
                <div className="space-y-4">
                  {resumo.proximosEventos.map((evento) => (
                    <div
                      key={evento.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: evento.color || "#3b82f6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{evento.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 inline" />
                          {formatarData(evento.start_date)}
                        </p>
                      </div>
                      <Link
                        href="/calendario"
                        className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                      >
                        Ver
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESUMO FINANCEIRO */}
            <div className="lg:col-span-1 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>

              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold">{saldoPct.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground">saldo</span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Receitas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(totalIncome)}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{pctReceitas.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Despesas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(totalExpense)}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{pctDespesas.toFixed(0)}%</span>
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