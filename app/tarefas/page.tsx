"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Task } from "@/types"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskForm } from "@/components/TaskForm"

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)

  async function loadTasks() {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setTasks(data)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  return (
    <div className="space-y-7 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter leading-none" style={{ fontFamily: "var(--font-display)" }}>Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-2">Gerencie suas tarefas</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {open && (
        <TaskForm
          onTaskAdded={() => {
            setOpen(false)
            loadTasks()
          }}
        />
      )}

      <div className="grid gap-2">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border bg-card">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Nova Tarefa" para começar</p>
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border bg-card p-4 shadow-xs hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-foreground truncate">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>
              <span className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full font-medium shrink-0">
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}