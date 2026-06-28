'use client'

import { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function InputValor({ value, onChange, required }: Props) {
  function formatar(v: string) {
    const numeros = v.replace(/\D/g, '').replace(/^0+/, '')
    if (numeros.length === 0) return ''

    const inteiro = numeros.slice(0, -2) || '0'
    const centavos = numeros.slice(-2).padStart(2, '0')
    const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return `${comMilhar},${centavos}`
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatar(e.target.value))
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        className="w-full mt-1 rounded-lg border px-8 py-2 text-sm bg-background"
        placeholder="0,00"
        required={required}
      />
    </div>
  )
}