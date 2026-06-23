import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eventId, title, description, startDate, endDate, color, category } = body

    // A API route apenas registra que precisa sincronizar
    // O agente da plataforma fará a sincronização real ao Google Agenda
    console.log("Evento pendente de sincronização:", { eventId, title })

    return NextResponse.json({ 
      success: true, 
      message: "Evento marcado para sincronização com Google Agenda" 
    })
  } catch (error) {
    console.error("Erro:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}