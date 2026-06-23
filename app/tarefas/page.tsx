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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">Gerencie suas tarefas</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
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

      <div className="grid gap-3">
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma tarefa cadastrada ainda.
          </p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                )}
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}