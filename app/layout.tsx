import type { Metadata } from "next"
import { DM_Serif_Display, Archivo_Black } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { Toaster } from "sonner"

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
})

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "Assistente Pessoal",
  description: "Agenda Inteligente + Controle Financeiro",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSerif.variable} ${archivoBlack.variable}`}>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-8 md:px-10 md:py-10 pt-20 md:pt-10">
              {children}
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}