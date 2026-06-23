"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus, X, Smile,
  Search, Trash2, Edit3, Clock, Repeat, RefreshCw, CheckCircle2,
  AlertCircle, List,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarEvent {
  id: number
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  color: string | null
  category: string | null
  repeat: string | null
  google_event_id: string | null
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const dayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]

const categories = [
  { label: "Trabalho", color: "#3b82f6" },
  { label: "Pessoal", color: "#10b981" },
  { label: "Saúde", color: "#ef4444" },
  { label: "Estudos", color: "#f59e0b" },
  { label: "Finanças", color: "#8b5cf6" },
  { label: "Lazer", color: "#ec4899" },
]

const reminders = [
  "5 minutos", "15 minutos", "30 minutos", "1 hora",
  "2 horas", "1 dia", "Não lembrar",
]

const repeatOptions = [
  { value: "none", label: "Não repetir" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
]

function gerarInstanciasRecorrentes(evento: CalendarEvent, year: number, month: number): CalendarEvent[] {
  if (!evento.repeat || evento.repeat === "none") return [evento]
  const instancias: CalendarEvent[] = []
  const dataInicio = new Date(evento.start_date)
  const diaEvento = dataInicio.getDate()
  const diaSemanaEvento = dataInicio.getDay()
  const horaInicio = dataInicio.toTimeString().slice(0, 8)
  const horaFim = evento.end_date ? new Date(evento.end_date).toTimeString().slice(0, 8) : null
  const primeiroDia = new Date(year, month, 1)
  const ultimoDia = new Date(year, month + 1, 0)

  if (evento.repeat === "daily") {
    const atual = new Date(primeiroDia)
    while (atual <= ultimoDia) {
      const dataStr = atual.toISOString().split("T")[0]
      instancias.push({ ...evento, id: evento.id * 1000 + atual.getDate(), start_date: `${dataStr}T${horaInicio}`, end_date: horaFim ? `${dataStr}T${horaFim}` : null })
      atual.setDate(atual.getDate() + 1)
    }
  } else if (evento.repeat === "weekly") {
    const atual = new Date(primeiroDia)
    while (atual <= ultimoDia) {
      if (atual.getDay() === diaSemanaEvento) {
        const dataStr = atual.toISOString().split("T")[0]
        instancias.push({ ...evento, id: evento.id * 1000 + atual.getDate(), start_date: `${dataStr}T${horaInicio}`, end_date: horaFim ? `${dataStr}T${horaFim}` : null })
      }
      atual.setDate(atual.getDate() + 1)
    }
  } else if (evento.repeat === "monthly") {
    const atual = new Date(year, month, Math.min(diaEvento, new Date(year, month + 1, 0).getDate()))
    if (atual >= primeiroDia && atual <= ultimoDia && atual >= dataInicio) {
      const dataStr = atual.toISOString().split("T")[0]
      instancias.push({ ...evento, id: evento.id * 1000 + atual.getDate(), start_date: `${dataStr}T${horaInicio}`, end_date: horaFim ? `${dataStr}T${horaFim}` : null })
    }
  }
  return instancias
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null)
  const [viewingDayEvents, setViewingDayEvents] = useState<{ dateStr: string; events: CalendarEvent[] } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")

  const [formTitle, setFormTitle] = useState("")
  const [formCategory, setFormCategory] = useState("Trabalho")
  const [formStartDate, setFormStartDate] = useState("")
  const [formStartTime, setFormStartTime] = useState("12:00")
  const [formEndDate, setFormEndDate] = useState("")
  const [formEndTime, setFormEndTime] = useState("13:00")
  const [formReminder, setFormReminder] = useState("15 minutos")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("#3b82f6")
  const [formRepeat, setFormRepeat] = useState("none")
  const [formSyncToGoogle, setFormSyncToGoogle] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const loadEvents = useCallback(async () => {
    const firstDay = new Date(year, month, 1).toISOString().split("T")[0]
    const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0]
    const { data } = await supabase.from("events").select("*").gte("start_date", firstDay).lte("start_date", lastDay).order("start_date", { ascending: true })
    if (data) {
      const todos: CalendarEvent[] = []
      for (const evento of data) {
        const instancias = gerarInstanciasRecorrentes(evento, year, month)
        todos.push(...instancias)
      }
      const vistos = new Set<number>()
      const dedup = todos.filter(e => { if (vistos.has(e.id)) return false; vistos.add(e.id); return true })
      setEvents(dedup)
    }
  }, [month, year])

  useEffect(() => { loadEvents() }, [loadEvents])

  function openModal(evento?: CalendarEvent) {
    setEditingEvent(evento || null)
    if (evento) {
      setFormTitle(evento.title)
      setFormCategory(evento.category || "Trabalho")
      const inicio = new Date(evento.start_date)
      setFormStartDate(inicio.toISOString().split("T")[0])
      setFormStartTime(inicio.toTimeString().slice(0, 5))
      if (evento.end_date) {
        const fim = new Date(evento.end_date)
        setFormEndDate(fim.toISOString().split("T")[0])
        setFormEndTime(fim.toTimeString().slice(0, 5))
      } else { setFormEndDate(inicio.toISOString().split("T")[0]); setFormEndTime("13:00") }
      setFormDescription(evento.description || "")
      setFormColor(evento.color || "#3b82f6")
      setFormRepeat(evento.repeat || "none")
      setFormSyncToGoogle(false)
    } else {
      const date = selectedDate || new Date().toISOString().split("T")[0]
      setFormStartDate(date); setFormEndDate(date)
      setFormTitle(""); setFormCategory("Trabalho"); setFormStartTime("12:00"); setFormEndTime("13:00")
      setFormReminder("15 minutos"); setFormDescription(""); setFormColor("#3b82f6"); setFormRepeat("none")
      setFormSyncToGoogle(true)
    }
    setShowModal(true)
  }

  function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    const dayEvents = events.filter(e => e.start_date.startsWith(dateStr))

    if (dayEvents.length > 0) {
      // Mostra popup com todos os eventos do dia
      setViewingDayEvents({ dateStr, events: dayEvents })
    } else {
      // Abre o formulário de criação
      openModal()
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    setSaving(true)
    const start = `${formStartDate}T${formStartTime}:00`
    const end = `${formEndDate}T${formEndTime}:00`
    const repeatVal = formRepeat === "none" ? null : formRepeat

    if (editingEvent) {
      await supabase.from("events").update({
        title: formTitle.trim(), description: formDescription.trim() || null,
        start_date: start, end_date: end, color: formColor, category: formCategory, repeat: repeatVal,
      }).eq("id", editingEvent.id)
    } else {
      const { data } = await supabase.from("events").insert({
        title: formTitle.trim(), description: formDescription.trim() || null,
        start_date: start, end_date: end, color: formColor, category: formCategory, repeat: repeatVal,
      }).select()
      if (formSyncToGoogle && data && data[0]) {
        try {
          await fetch("/api/calendar/sync-to-google", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: data[0].id, title: formTitle.trim(), description: formDescription.trim() || undefined, startDate: start, endDate: end, color: formColor, category: formCategory }),
          })
        } catch (err) { console.error("Erro ao sincronizar:", err) }
      }
    }
    setSaving(false); setShowModal(false); setEditingEvent(null)
    loadEvents()
  }

  async function handleDelete(evento: CalendarEvent) {
    if (!confirm(`Excluir "${evento.title}"?`)) return
    setDeleting(true)
    await supabase.from("events").delete().eq("id", evento.id)
    setDeleting(false); setViewingEvent(null); setViewingDayEvents(null)
    loadEvents()
  }

  async function syncFromGoogle() {
    setSyncing(true); setSyncStatus("syncing")
    try {
      await fetch("/api/calendar/sync-from-google", { method: "POST" })
      setSyncStatus("success"); loadEvents()
      setTimeout(() => setSyncStatus("idle"), 3000)
    } catch { setSyncStatus("error"); setTimeout(() => setSyncStatus("idle"), 4000) }
    setSyncing(false)
  }

  function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00")
    const hoje = new Date()
    const isHoje = d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
    if (isHoje) return "HOJE"
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)
    const isAmanha = d.getDate() === amanha.getDate() && d.getMonth() === amanha.getMonth() && d.getFullYear() === amanha.getFullYear()
    if (isAmanha) return "AMANHÃ"
    return `${["DOM","SEG","TER","QUA","QUI","SEX","SAB"][d.getDay()]}, ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
  }

  function getGroupedEvents() {
    const grouped: Record<string, CalendarEvent[]> = {}
    let filtered = events
    if (categoryFilter) filtered = filtered.filter(e => e.category === categoryFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)))
    }
    filtered.forEach(e => {
      const k = e.start_date.split("T")[0]
      if (!grouped[k]) grouped[k] = []
      grouped[k].push(e)
    })
    return grouped
  }

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const hoje = new Date()
  const groupedEvents = getGroupedEvents()
  const sortedDates = Object.keys(groupedEvents).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">Visualize e gerencie seus eventos</p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus === "success" && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Sincronizado
            </span>
          )}
          {syncStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
              <AlertCircle className="h-3.5 w-3.5" /> Erro
            </span>
          )}
          <Button variant="outline" onClick={syncFromGoogle} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
          <Button onClick={() => { setSelectedDate(new Date().toISOString().split("T")[0]); openModal() }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Evento
          </Button>
        </div>
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Pesquisar eventos por nome ou descrição..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-card text-sm outline-none focus:border-primary/50 transition-colors" />
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Calendário Mensal */}
        <div className="flex-1 rounded-xl border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null) }}
              className="p-2 hover:bg-accent rounded-lg transition-colors"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-lg font-semibold">{monthNames[month]}/{year}</h2>
            <button onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null) }}
              className="p-2 hover:bg-accent rounded-lg transition-colors"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="min-h-[90px]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = events.filter(e => e.start_date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`))
              const isHoje = day === hoje.getDate() && month === hoje.getMonth() && year === hoje.getFullYear()
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isSelected = selectedDate === dateStr
              return (
                <button key={day} onClick={() => handleDayClick(day)}
                  className={`min-h-[90px] rounded-lg border p-1.5 text-left transition-all cursor-pointer hover:border-primary/50 ${
                    isSelected ? "border-primary bg-primary/5" : isHoje ? "border-primary/50 bg-primary/5" : "border-border"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isHoje ? "text-primary" : "text-foreground"}`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary font-medium rounded-full px-1.5 py-0.5">{dayEvents.length}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} onClick={ev => { ev.stopPropagation(); setViewingEvent(e) }}
                        className="text-[10px] truncate rounded px-1 py-0.5 text-white cursor-pointer hover:opacity-80 flex items-center gap-1"
                        style={{ backgroundColor: e.color || "#3b82f6" }}>
                        {e.google_event_id && <span className="text-[8px] opacity-70">◉</span>}
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] font-medium text-primary">Ver todos ({dayEvents.length})</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel Lateral */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Por atividade</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b">
              <button onClick={() => setCategoryFilter(null)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"}`}>Todas</button>
              {categories.map(cat => (
                <button key={cat.label} onClick={() => setCategoryFilter(categoryFilter === cat.label ? null : cat.label)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${categoryFilter === cat.label ? "text-white" : "bg-accent text-muted-foreground hover:bg-accent/80"}`}
                  style={categoryFilter === cat.label ? { backgroundColor: cat.color } : {}}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />{cat.label}
                </button>
              ))}
            </div>
            {sortedDates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">{searchQuery || categoryFilter ? "Nenhum evento encontrado." : "Nenhum evento neste mês."}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {sortedDates.map(dateStr => (
                  <div key={dateStr}>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{formatDateHeader(dateStr)}</p>
                    {groupedEvents[dateStr].map(e => (
                      <button key={e.id} onClick={() => setViewingEvent(e)}
                        className={`w-full text-left rounded-lg p-2.5 transition-colors hover:bg-accent ${viewingEvent?.id === e.id ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color || "#3b82f6" }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                              {e.google_event_id && <span className="text-[10px] text-blue-500" title="Sincronizado">◉</span>}
                              {e.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(e.start_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              {e.repeat && e.repeat !== "none" && <span className="ml-1 text-[10px] uppercase opacity-60">• {repeatOptions.find(r => r.value === e.repeat)?.label}</span>}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📋 Popup - Todos os Eventos de um Dia */}
      {viewingDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewingDayEvents(null)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">
                  {(() => {
                    const d = new Date(viewingDayEvents.dateStr + "T12:00:00")
                    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
                  })()}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { const ds = viewingDayEvents.dateStr; setViewingDayEvents(null); setSelectedDate(ds); openModal() }}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Novo
                </button>
                <button onClick={() => setViewingDayEvents(null)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {viewingDayEvents.events.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">Nenhum evento neste dia.</p>
              ) : (
                viewingDayEvents.events.map(e => (
                  <button key={e.id} onClick={() => { setViewingDayEvents(null); setViewingEvent(e) }}
                    className="w-full text-left rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-3.5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: e.color || "#3b82f6" }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{e.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-400">
                            {new Date(e.start_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {e.category && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">{e.category}</span>
                          )}
                          {e.repeat && e.repeat !== "none" && (
                            <span className="text-[10px] text-zinc-500">🔄 {repeatOptions.find(r => r.value === e.repeat)?.label}</span>
                          )}
                        </div>
                        {e.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{e.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 mt-1 shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📋 Popup Visualizar Evento */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewingEvent(null)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setViewingEvent(null)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <div className="flex items-center gap-2">
                {viewingEvent.google_event_id && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Google</span>
                )}
                <button onClick={() => { const ev = viewingEvent; setViewingEvent(null); openModal(ev) }}
                  className="text-zinc-400 hover:text-blue-400 p-1" title="Editar"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(viewingEvent)} disabled={deleting}
                  className="text-zinc-400 hover:text-red-400 p-1" title="Excluir"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: viewingEvent.color || "#3b82f6" }} />
                <h2 className="text-lg font-semibold text-white">{viewingEvent.title}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(viewingEvent.start_date).toLocaleDateString("pt-BR")} às {new Date(viewingEvent.start_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {viewingEvent.category && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: viewingEvent.color || "#3b82f6" }} />
                    <span>{viewingEvent.category}</span>
                  </div>
                )}
                {viewingEvent.repeat && viewingEvent.repeat !== "none" && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Repeat className="h-4 w-4" />
                    <span>{repeatOptions.find(r => r.value === viewingEvent.repeat)?.label}</span>
                  </div>
                )}
                {viewingEvent.description && (
                  <div className="pt-2 border-t border-zinc-700">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Descrição</p>
                    <p className="text-sm text-zinc-300">{viewingEvent.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📝 Modal Criar/Editar Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
              <button onClick={handleSave} disabled={saving || !formTitle.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium transition-colors">
                {saving ? "Salvando..." : editingEvent ? "Atualizar" : "Salvar"}
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-5">
              <input type="text" placeholder="Nome do Evento/Tarefa" value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-transparent text-white text-xl font-semibold placeholder-zinc-500 outline-none border-b border-transparent focus:border-blue-500 pb-2 transition-colors" autoFocus />
              <button type="button" className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400"><Smile className="h-5 w-5" /></button>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat.label} type="button" onClick={() => { setFormCategory(cat.label); setFormColor(cat.color) }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${formCategory === cat.label ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />{cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Início</label>
                  <div className="space-y-2">
                    <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)}
                      className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500" />
                    <input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)}
                      className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Fim</label>
                  <div className="space-y-2">
                    <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)}
                      className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500" />
                    <input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)}
                      className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Repetir</label>
                <div className="flex flex-wrap gap-2">
                  {repeatOptions.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setFormRepeat(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${formRepeat === opt.value ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              {!editingEvent && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <input type="checkbox" id="syncGoogle" checked={formSyncToGoogle} onChange={e => setFormSyncToGoogle(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="syncGoogle" className="text-sm text-zinc-300 cursor-pointer">
                    Sincronizar com <strong className="text-blue-400">Google Agenda</strong>
                  </label>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Lembrete</label>
                <select value={formReminder} onChange={e => setFormReminder(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500">
                  {reminders.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Descrição</label>
                <textarea placeholder="Adicione uma descrição..." value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-blue-500 resize-none placeholder-zinc-500" />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}