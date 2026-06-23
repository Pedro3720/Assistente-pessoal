"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { CheckSquare, Calendar, Wallet, Dumbbell, Clock } from "lucide-react"
import Link from "next/link"

interface Evento {
  id: number
  title: string
  start_date: string
  color: string | null
}

interface Resumo {
  tarefasPendentes: number
  eventosHoje: number
  saldoMes: number
  treinosMes: number
  proximosEventos: Evento[]
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<Resumo>({
    tarefasPendentes: 0,
    eventosHoje: 0,
    saldoMes: 0,
    treinosMes: 0,
    proximosEventos: [],
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

    // Contar tarefas pendentes
    const { count: tarefas } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    // Contar eventos de hoje
    const { count: eventos } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("start_date", `${hoje}T00:00:00`)
      .lte("start_date", `${hoje}T23:59:59`)

    // Contar treinos do mês (categoria "Saúde")
    const { count: treinos } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("category", "Saúde")
      .gte("start_date", `${inicioMes}T00:00:00`)
      .lte("start_date", `${hoje}T23:59:59`)

    // Buscar próximos eventos (a partir de hoje)
    const { data: proximos } = await supabase
      .from("events")
      .select("id, title, start_date, color")
      .gte("start_date", `${hoje}T00:00:00`)
      .order("start_date", { ascending: true })
      .limit(5)

    setResumo({
      tarefasPendentes: tarefas || 0,
      eventosHoje: eventos || 0,
      saldoMes: 0,
      treinosMes: treinos || 0,
      proximosEventos: (proximos as Evento[]) || [],
    })

    setLoading(false)
  }

  function formatarData(data: string) {
    const d = new Date(data)
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const cards = [
    {
      title: "Tarefas Pendentes",
      value: String(resumo.tarefasPendentes),
      icon: CheckSquare,
      href: "/tarefas",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Eventos Hoje",
      value: String(resumo.eventosHoje),
      icon: Calendar,
      href: "/calendario",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Saldo do Mês",
      value: `R$ ${resumo.saldoMes.toFixed(2)}`,
      icon: Wallet,
      href: "/financas",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Treinos no Mês",
      value: String(resumo.treinosMes),
      icon: Dumbbell,
      href: "/treinos",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumo da sua agenda e finanças</p>
      </div>

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
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximos Eventos */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Próximos Eventos</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : resumo.proximosEventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento nos próximos dias.
            </p>
          ) : (
            <div className="space-y-3">
              {resumo.proximosEventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: evento.color || "#3b82f6",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {evento.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatarData(evento.start_date)}</span>
                    </div>
                  </div>
                  <Link
                    href="/calendario"
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Transações */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Últimas Transações</h2>
          <p className="text-sm text-muted-foreground">
            Nenhuma transação registrada.
          </p>
        </div>
      </div>
    </div>
  )
}