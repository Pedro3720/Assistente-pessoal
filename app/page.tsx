import { CheckSquare, Calendar, Wallet, Users } from "lucide-react"
import Link from "next/link"

const cards = [
  {
    title: "Tarefas Pendentes",
    value: "0",
    icon: CheckSquare,
    href: "/tarefas",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Eventos Hoje",
    value: "0",
    icon: Calendar,
    href: "/calendario",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Saldo do Mês",
    value: "R$ 0,00",
    icon: Wallet,
    href: "/financas",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Contatos",
    value: "0",
    icon: Users,
    href: "/contatos",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumo da sua agenda e finanças
        </p>
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
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
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
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Próximos Eventos</h2>
          <p className="text-sm text-muted-foreground">
            Nenhum evento nos próximos dias.
          </p>
        </div>

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