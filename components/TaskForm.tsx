"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

interface TaskFormProps {
  onTaskAdded: () => void
}

export function TaskForm({ onTaskAdded }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("O título é obrigatório")
      return
    }

    setLoading(true)

    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      status: "pending",
      priority: "medium",
    })

    setLoading(false)

    if (error) {
      toast.error("Erro ao adicionar tarefa")
    } else {
      toast.success("Tarefa adicionada!")
      setTitle("")
      onTaskAdded()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
    >
      <div>
        <label className="text-sm font-medium">Título da tarefa</label>
        <Input
          placeholder="Digite o título..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  )
}   