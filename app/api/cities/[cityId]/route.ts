import { NextResponse } from "next/server"
import { UnauthenticatedError, verifyBearer } from "@/lib/firebase/admin"
import { getOrCreateCity } from "@/lib/game/server"

// GET /api/cities/:cityId
// The :cityId segment is always "me" — the city is resolved from the
// authenticated Firebase user. On first login this creates the player's
// account and their procedural city; afterwards it just loads the data.
export async function GET(request: Request) {
  try {
    const user = await verifyBearer(request.headers.get("authorization"))
    const result = await getOrCreateCity(user)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ message: err.message }, { status: 401 })
    }
    console.log("[v0] GET city error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ message: "Algo deu errado. Tente novamente." }, { status: 500 })
  }
}
