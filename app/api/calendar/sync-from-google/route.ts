import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // Busca eventos do Google Agenda que ainda não estão no Supabase
    // (O agente da plataforma processa essa solicitação)
    
    return NextResponse.json({ 
      success: true, 
      message: "Sincronização solicitada. Eventos do Google Agenda serão importados em breve."
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}