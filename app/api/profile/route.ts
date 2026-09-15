import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"
import { UnauthenticatedError, verifyBearer } from "@/lib/firebase/admin"

export async function GET(request: Request) {
  try {
    const user = await verifyBearer(request.headers.get("authorization"))
    const snapshot = await adminDb().collection("users").doc(user.uid).get()
    return NextResponse.json({ isRenamed: snapshot.data()?.isRenamed === true })
  } catch (error) {
    if (error instanceof UnauthenticatedError) return NextResponse.json({ message: error.message }, { status: 401 })
    return NextResponse.json({ message: "Não foi possível carregar o perfil." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyBearer(request.headers.get("authorization"))
    const body = (await request.json()) as { displayName?: string }
    const displayName = body.displayName?.trim() ?? ""
    if (displayName.length < 2 || displayName.length > 40) return NextResponse.json({ message: "Nome inválido." }, { status: 400 })
    const ref = adminDb().collection("users").doc(user.uid)
    const snapshot = await ref.get()
    if (snapshot.data()?.isRenamed === true) return NextResponse.json({ message: "O nome já foi alterado." }, { status: 409 })
    await ref.set({ displayName, isRenamed: true }, { merge: true })
    return NextResponse.json({ isRenamed: true })
  } catch (error) {
    if (error instanceof UnauthenticatedError) return NextResponse.json({ message: error.message }, { status: 401 })
    return NextResponse.json({ message: "Não foi possível atualizar o perfil." }, { status: 500 })
  }
}
