export interface Contact {
  id: number
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  category: string | null
  created_at: string
}

export interface Event {
  id: number
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  color: string
  created_at: string
}

export interface Transaction {
  id: number
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string | null
  date: string
  payment_method: string | null
  notes: string | null
  created_at: string
}