import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Evento {
  id: number;
  title: string;
  start_date: string;
  color: string | null;
}

export interface Resumo {
  tarefasPendentes: number;
  eventosHoje: number;
  saldoMes: number;
  totalIncome: number;
  totalExpense: number;
  treinosMes: number;
  proximosEventos: Evento[];
  loading: boolean;
  error: string | null;
}

export function useDashboard(): { resumo: Resumo } {
  const [resumo, setResumo] = useState<Resumo>({
    tarefasPendentes: 0,
    eventosHoje: 0,
    saldoMes: 0,
    totalIncome: 0,
    totalExpense: 0,
    treinosMes: 0,
    proximosEventos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function carregarResumo() {
      try {
        setResumo((prev) => ({ ...prev, loading: true, error: null }));

        const hoje = new Date().toISOString().split('T')[0];
        const now = new Date();
        const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const [tarefasResult, eventosHojeResult, treinosResult, incomeResult, expenseResult, proximosResult] =
          await Promise.all([
            supabase.from('passwords').select('*', { count: 'exact', head: true }),
            supabase.from('events').select('*', { count: 'exact', head: true }).gte('start_date', `${hoje}T00:00:00`).lte('start_date', `${hoje}T23:59:59`),
            supabase.from('events').select('*', { count: 'exact', head: true }).eq('category', 'Saúde').gte('start_date', inicioMes),
            supabase.from('transactions').select('amount').eq('type', 'income').gte('date', inicioMes),
            supabase.from('transactions').select('amount').eq('type', 'expense').gte('date', inicioMes),
            supabase.from('events').select('id, title, start_date, color').gte('start_date', hoje).order('start_date', { ascending: true }).limit(5),
          ]);

        if (signal.aborted) return;

        if (tarefasResult.error) throw tarefasResult.error;
        if (eventosHojeResult.error) throw eventosHojeResult.error;
        if (treinosResult.error) throw treinosResult.error;
        if (incomeResult.error) throw incomeResult.error;
        if (expenseResult.error) throw expenseResult.error;
        if (proximosResult.error) throw proximosResult.error;

        const tarefasPendentes = tarefasResult.count ?? 0;
        const eventosHoje = eventosHojeResult.count ?? 0;
        const treinosMes = treinosResult.count ?? 0;

        const totalIncome = (incomeResult.data || []).reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        const totalExpense = (expenseResult.data || []).reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        const saldoMes = totalIncome - totalExpense;

        const proximosEventos: Evento[] = (proximosResult.data || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          start_date: e.start_date,
          color: e.color,
        }));

        setResumo({
          tarefasPendentes,
          eventosHoje,
          saldoMes,
          totalIncome,
          totalExpense,
          treinosMes,
          proximosEventos,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar resumo';
        setResumo((prev) => ({ ...prev, loading: false, error: message }));
      }
    }

    carregarResumo();
    return () => controller.abort();
  }, []);

  return { resumo };
}