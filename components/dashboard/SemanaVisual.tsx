"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

interface Evento {
  id: number
  start_date: string
  color: string | null
}

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function getInicioSemana(hoje: Date): Date {
  const d = new Date(hoje)
  const dia = d.getDay()
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function SemanaVisual() {
  const router = useRouter()
  const [eventos, setEventos] = useState<Evento[]>([])
  const hoje = new Date()
  const hojeStr = toDateStr(hoje)
  const inicio = getInicioSemana(hoje)

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d
  })

  useEffect(() => {
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)
    supabase
      .from("events")
      .select("id, start_date, color")
      .gte("start_date", toDateStr(inicio))
      .lte("start_date", toDateStr(fim) + "T23:59:59")
      .then(({ data }) => {
        if (data) setEventos(data)
      })
  }, [])

  return (
    <div className="grid grid-cols-7 gap-2">
      {dias.map((dia) => {
        const dateStr = toDateStr(dia)
        const isHoje = dateStr === hojeStr
        const eventosNoDia = eventos.filter((e) => e.start_date.startsWith(dateStr))

        return (
          <button
            key={dateStr}
            onClick={() => router.push("/calendario")}
            className={cn(
              "flex flex-col items-center gap-2 py-3 px-1 rounded-xl transition-colors text-center",
              isHoje
                ? "bg-primary/8 hover:bg-primary/12"
                : "hover:bg-accent"
            )}
          >
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {DIAS_CURTOS[dia.getDay()]}
            </span>
            <span
              className={cn(
                "text-sm font-semibold leading-none flex items-center justify-center h-7 w-7 rounded-full transition-colors",
                isHoje
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              )}
            >
              {dia.getDate()}
            </span>
            <div className="flex items-center justify-center gap-0.5 h-3">
              {eventosNoDia.slice(0, 3).map((e, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: e.color || "var(--color-primary)" }}
                />
              ))}
              {eventosNoDia.length === 0 && (
                <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
