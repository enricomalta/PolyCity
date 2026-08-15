import { NextResponse } from "next/server"
import type { GameAction } from "@/types/game"
import { UnauthenticatedError, verifyBearer } from "@/lib/firebase/admin"
import { performAction } from "@/lib/game/server"

// POST /api/cities/:cityId/actions
// Accepts a single player INTENTION (BUILD / DEMOLISH / SET_POLICY), applies
// it authoritatively on the server and returns the new authoritative state.
// Game-rule rejections (e.g. insufficient funds) come back with HTTP 200 and
// success:false so the UI can show a friendly message.
export async function POST(request: Request) {
  try {
    const user = await verifyBearer(request.headers.get("authorization"))
    const action = (await request.json()) as GameAction
    const result = await performAction(user, action)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ message: err.message }, { status: 401 })
    }
    console.log("[v0] POST action error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ message: "Algo deu errado. Tente novamente." }, { status: 500 })
  }
}
