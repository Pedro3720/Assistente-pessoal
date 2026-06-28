'use client'

import { useState, useCallback, useRef } from 'react'
import {
  X, Upload, ChevronRight, Check, AlertCircle,
  FileText, RefreshCw, ChevronDown,
} from 'lucide-react'
import { parseFile, ParsedTx } from '@/lib/parsers/ofxParser'

// ── Auto-categorização por palavra-chave ──────────────────────────────────

type AutoRule = [keyword: string, category: string, type: 'income' | 'expense']

const RULES: AutoRule[] = [
  // Alimentação
  ['supermercado', 'Alimentação', 'expense'],
  ['mercadao',     'Alimentação', 'expense'],
  ['mercado',      'Alimentação', 'expense'],
  ['padaria',      'Alimentação', 'expense'],
  ['restaurante',  'Alimentação', 'expense'],
  ['lanchonete',   'Alimentação', 'expense'],
  ['lanche',       'Alimentação', 'expense'],
  ['ifood',        'Alimentação', 'expense'],
  ['rappi',        'Alimentação', 'expense'],
  ['pizzaria',     'Alimentação', 'expense'],
  ['acougue',      'Alimentação', 'expense'],
  ['hortifruti',   'Alimentação', 'expense'],
  // Transporte
  ['uber',         'Transporte',  'expense'],
  ['99pop',        'Transporte',  'expense'],
  ['99taxi',       'Transporte',  'expense'],
  ['cabify',       'Transporte',  'expense'],
  ['posto ',       'Transporte',  'expense'],
  ['gasolina',     'Transporte',  'expense'],
  ['combustivel',  'Transporte',  'expense'],
  ['estacionamento','Transporte', 'expense'],
  ['pedagio',      'Transporte',  'expense'],
  ['onibus',       'Transporte',  'expense'],
  ['metro',        'Transporte',  'expense'],
  // Moradia
  ['aluguel',      'Moradia',     'expense'],
  ['condominio',   'Moradia',     'expense'],
  ['iptu',         'Moradia',     'expense'],
  ['agua ',        'Moradia',     'expense'],
  ['sabesp',       'Moradia',     'expense'],
  ['copasa',       'Moradia',     'expense'],
  ['energia',      'Moradia',     'expense'],
  ['enel',         'Moradia',     'expense'],
  ['cemig',        'Moradia',     'expense'],
  ['luz ',         'Moradia',     'expense'],
  ['internet',     'Moradia',     'expense'],
  ['vivo ',        'Moradia',     'expense'],
  ['claro ',       'Moradia',     'expense'],
  ['tim ',         'Moradia',     'expense'],
  // Saúde
  ['farmacia',     'Saúde',       'expense'],
  ['drogaria',     'Saúde',       'expense'],
  ['droga',        'Saúde',       'expense'],
  ['hospital',     'Saúde',       'expense'],
  ['clinica',      'Saúde',       'expense'],
  ['medico',       'Saúde',       'expense'],
  ['laboratorio',  'Saúde',       'expense'],
  ['plano saude',  'Saúde',       'expense'],
  ['unimed',       'Saúde',       'expense'],
  ['hapvida',      'Saúde',       'expense'],
  ['academia',     'Saúde',       'expense'],
  // Educação
  ['faculdade',    'Educação',    'expense'],
  ['universidade', 'Educação',    'expense'],
  ['escola',       'Educação',    'expense'],
  ['mensalidade',  'Educação',    'expense'],
  ['curso',        'Educação',    'expense'],
  ['livro',        'Educação',    'expense'],
  // Lazer
  ['cinema',       'Lazer',       'expense'],
  ['teatro',       'Lazer',       'expense'],
  ['show ',        'Lazer',       'expense'],
  ['parque',       'Lazer',       'expense'],
  ['shopping',     'Lazer',       'expense'],
  // Assinaturas
  ['netflix',      'Assinaturas', 'expense'],
  ['spotify',      'Assinaturas', 'expense'],
  ['amazon prime', 'Assinaturas', 'expense'],
  ['disney',       'Assinaturas', 'expense'],
  ['hbo',          'Assinaturas', 'expense'],
  ['youtube',      'Assinaturas', 'expense'],
  ['globoplay',    'Assinaturas', 'expense'],
  ['apple',        'Assinaturas', 'expense'],
  // Receitas
  ['salario',      'Salário',          'income'],
  ['vencimento',   'Salário',          'income'],
  ['holerite',     'Salário',          'income'],
  ['pix recebido', 'Outras Receitas',  'income'],
  ['transf recebida','Outras Receitas','income'],
  ['rendimento',   'Investimentos',    'income'],
  ['dividendo',    'Investimentos',    'income'],
  ['juros sobre',  'Investimentos',    'income'],
  ['resgate',      'Investimentos',    'income'],
]

function autoCateg(
  desc: string,
  amount: number,
  allDespesa: string[],
  allReceita: string[],
): { type: 'income' | 'expense'; category: string } {
  const norm = desc.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  for (const [kw, cat, type] of RULES) {
    if (norm.includes(kw)) {
      // Usa a categoria se existir na lista do usuário, senão o primeiro disponível do mesmo tipo
      const list = type === 'income' ? allReceita : allDespesa
      const resolved = list.includes(cat) ? cat : list[0]
      return { type, category: resolved }
    }
  }

  if (amount > 0) return { type: 'income',  category: allReceita[0] || 'Outras Receitas' }
  return             { type: 'expense', category: allDespesa[0] || 'Outros' }
}

// ── Tipos ─────────────────────────────────────────────────────────────────

interface ImportRow extends ParsedTx {
  type: 'income' | 'expense'
  category: string
  bankId: number | null
  skip: boolean
}

interface Props {
  banks: { id: number; name: string; icon: string }[]
  allDespesa: string[]
  allReceita: string[]
  allIcons: Record<string, string>
  onClose: () => void
  onImport: (txs: {
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    bank_id: number | null
    date: string
  }[]) => Promise<void>
}

type Step = 'upload' | 'categorize' | 'done'

// ── Componente ────────────────────────────────────────────────────────────

export function ImportModal({ banks, allDespesa, allReceita, allIcons, onClose, onImport }: Props) {
  const [step, setStep]           = useState<Step>('upload')
  const [rows, setRows]           = useState<ImportRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [fileName, setFileName]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── bulk select para tipo/categoria ── */
  const [bulkType, setBulkType] = useState<'income' | 'expense' | ''>('')
  const [bulkCat, setBulkCat]   = useState('')
  const [bulkBank, setBulkBank] = useState<string>('')

  const applyBulk = useCallback(() => {
    setRows(prev => prev.map(r => {
      if (r.skip) return r
      const next = { ...r }
      if (bulkType) {
        next.type = bulkType
        next.category = bulkType === 'income' ? allReceita[0] : allDespesa[0]
      }
      if (bulkCat) next.category = bulkCat
      if (bulkBank !== '') next.bankId = bulkBank ? Number(bulkBank) : null
      return next
    }))
  }, [bulkType, bulkCat, bulkBank, allDespesa, allReceita])

  const handleFile = useCallback(async (file: File) => {
    setParseError(null)
    setFileName(file.name)
    try {
      const parsed = await parseFile(file)
      if (parsed.length === 0) {
        setParseError('Nenhuma transação encontrada. Verifique se o arquivo é um OFX ou CSV válido do seu banco.')
        return
      }
      const defaultBankId = banks.length === 1 ? banks[0].id : null
      const importRows: ImportRow[] = parsed.map(tx => {
        const { type, category } = autoCateg(tx.description, tx.amount, allDespesa, allReceita)
        return { ...tx, type, category, bankId: defaultBankId, skip: false }
      })
      setRows(importRows)
      setStep('categorize')
    } catch (e: any) {
      setParseError(e?.message || 'Erro ao processar o arquivo.')
    }
  }, [banks, allDespesa, allReceita])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const updateRow = useCallback((id: string, changes: Partial<ImportRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r))
  }, [])

  const toImport = rows.filter(r => !r.skip)

  const handleImport = useCallback(async () => {
    if (!toImport.length) return
    setImporting(true)
    setParseError(null)
    try {
      await onImport(toImport.map(r => ({
        description: r.description,
        amount: Math.abs(r.amount),
        type: r.type,
        category: r.category,
        bank_id: r.bankId,
        date: r.date,
      })))
      setImportedCount(toImport.length)
      setStep('done')
    } catch (e: any) {
      setParseError(e?.message || 'Erro ao importar as transações.')
    } finally {
      setImporting(false)
    }
  }, [toImport, onImport])

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(n))

  const STEPS: Step[] = ['upload', 'categorize', 'done']
  const STEP_LABELS   = { upload: 'Arquivo', categorize: 'Categorizar', done: 'Concluído' }
  const stepIdx = STEPS.indexOf(step)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-5xl flex-col rounded-2xl border border-border bg-popover shadow-2xl"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Importar Extrato</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step === 'upload'     && 'Selecione um arquivo OFX ou CSV exportado do seu banco'}
              {step === 'categorize' && `${rows.length} transações encontradas em "${fileName}" — revise e categorize`}
              {step === 'done'       && `${importedCount} transações importadas com sucesso`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-6 py-2.5">
          {STEPS.map((s, i) => {
            const done = i < stepIdx
            const active = i === stepIdx
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  done   ? 'bg-green-500 text-white' :
                  active ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={`text-xs ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {STEP_LABELS[s]}
                </span>
                {i < STEPS.length - 1 && <ChevronRight className="mx-1 h-3 w-3 text-muted-foreground" />}
              </div>
            )
          })}
        </div>

        {/* ── Content ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* STEP 1 — Upload */}
          {step === 'upload' && (
            <div className="flex min-h-80 flex-col items-center justify-center gap-6 p-10">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex w-full max-w-md cursor-pointer flex-col items-center gap-5 rounded-2xl border-2 border-dashed p-12 transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Arraste o arquivo aqui</p>
                  <p className="mt-1 text-sm text-muted-foreground">ou clique para selecionar</p>
                </div>
                <div className="flex gap-2">
                  {['.ofx', '.csv', '.txt'].map(ext => (
                    <span key={ext} className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".ofx,.ofc,.csv,.txt"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
              />

              {parseError && (
                <div className="flex max-w-md items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="max-w-sm text-center text-xs text-muted-foreground">
                Exporte o extrato pelo app ou internet banking do seu banco (geralmente em
                <strong className="text-foreground"> Extratos → Exportar</strong>).
                Arquivos OFX mantêm mais informações que CSV.
              </div>
            </div>
          )}

          {/* STEP 2 — Categorize */}
          {step === 'categorize' && (
            <>
              {/* Barra de ações em lote */}
              <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">Aplicar em todas:</span>

                <select
                  value={bulkType}
                  onChange={e => setBulkType(e.target.value as any)}
                  className="rounded-lg border border-border bg-popover px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                >
                  <option value="">Tipo...</option>
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>

                <select
                  value={bulkCat}
                  onChange={e => setBulkCat(e.target.value)}
                  className="rounded-lg border border-border bg-popover px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                >
                  <option value="">Categoria...</option>
                  <optgroup label="Despesas">
                    {allDespesa.map(c => <option key={c} value={c}>{allIcons[c] || '📌'} {c}</option>)}
                  </optgroup>
                  <optgroup label="Receitas">
                    {allReceita.map(c => <option key={c} value={c}>{allIcons[c] || '💰'} {c}</option>)}
                  </optgroup>
                </select>

                <select
                  value={bulkBank}
                  onChange={e => setBulkBank(e.target.value)}
                  className="rounded-lg border border-border bg-popover px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                >
                  <option value="">Conta...</option>
                  <option value="">Sem conta</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                </select>

                <button
                  onClick={applyBulk}
                  disabled={!bulkType && !bulkCat && bulkBank === ''}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Aplicar
                </button>

                <span className="ml-auto text-xs text-muted-foreground">
                  {toImport.length}/{rows.length} selecionadas
                </span>
              </div>

              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                  <tr className="border-b border-border">
                    <th className="w-10 py-3 pl-4 text-left">
                      <input
                        type="checkbox"
                        checked={rows.every(r => !r.skip)}
                        onChange={e => setRows(prev => prev.map(r => ({ ...r, skip: !e.target.checked })))}
                        className="accent-primary"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Descrição</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Conta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map(row => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-accent/20 ${row.skip ? 'opacity-35' : ''}`}
                    >
                      <td className="py-2.5 pl-4">
                        <input
                          type="checkbox"
                          checked={!row.skip}
                          onChange={e => updateRow(row.id, { skip: !e.target.checked })}
                          className="accent-primary"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="max-w-[220px] px-4 py-2.5">
                        <span className="block truncate text-xs" title={row.description}>
                          {row.description}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold tabular-nums ${
                        row.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {row.type === 'income' ? '+' : '-'}{fmt(row.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={row.type}
                          disabled={row.skip}
                          onChange={e => {
                            const type = e.target.value as 'income' | 'expense'
                            updateRow(row.id, {
                              type,
                              category: type === 'income' ? allReceita[0] : allDespesa[0],
                            })
                          }}
                          className="w-24 rounded-md border border-border bg-muted px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 disabled:cursor-not-allowed"
                        >
                          <option value="expense">Despesa</option>
                          <option value="income">Receita</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={row.category}
                          disabled={row.skip}
                          onChange={e => updateRow(row.id, { category: e.target.value })}
                          className="w-36 rounded-md border border-border bg-muted px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 disabled:cursor-not-allowed"
                        >
                          {(row.type === 'income' ? allReceita : allDespesa).map(cat => (
                            <option key={cat} value={cat}>
                              {allIcons[cat] || '📌'} {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={row.bankId ?? ''}
                          disabled={row.skip}
                          onChange={e => updateRow(row.id, { bankId: e.target.value ? Number(e.target.value) : null })}
                          className="w-32 rounded-md border border-border bg-muted px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 disabled:cursor-not-allowed"
                        >
                          <option value="">Sem conta</option>
                          {banks.map(b => (
                            <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* STEP 3 — Done */}
          {step === 'done' && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-5 p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold">Importação concluída!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {importedCount} transação{importedCount !== 1 ? 'ões foram adicionadas' : ' foi adicionada'} com sucesso.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-1 rounded-xl bg-primary px-7 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step === 'categorize' && (
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{toImport.length}</span> de {rows.length} selecionadas
              {rows.length - toImport.length > 0 && (
                <span className="ml-1 text-muted-foreground">
                  · {rows.length - toImport.length} ignoradas
                </span>
              )}
            </div>

            {parseError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />{parseError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setStep('upload'); setRows([]) }}
                className="rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
              >
                Trocar arquivo
              </button>
              <button
                onClick={handleImport}
                disabled={importing || toImport.length === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {importing && <RefreshCw className="h-3 w-3 animate-spin" />}
                {importing ? 'Importando…' : `Importar ${toImport.length} transaç${toImport.length !== 1 ? 'ões' : 'ão'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
