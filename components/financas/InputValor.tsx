'use client'

import { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function InputValor({ value, onChange, required }: Props) {
  function formatar(v: string) {
    // Remove tudo que não é dígito
    const numeros = v.replace(/\D/g, '')
    if (numeros.length === 0) return ''

    // Converte para centavos (sempre 2 casas)
    const inteiro = numeros.slice(0, -2).padStart(1, '0') || '0'
    const centavos = numeros.slice(-2).padStart(2, '0')

    // Adiciona ponto dos milhares
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