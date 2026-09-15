import { NextResponse } from "next/server"
import { UnauthenticatedError, verifyBearer } from "@/lib/firebase/admin"
import { CityNotCreatedError, getOrCreateCity } from "@/lib/game/server"

// GET /api/cities/:cityId
// The :cityId segment is always "me" — the city is resolved from the
// authenticated Firebase user. On first login this creates the player's
// account and their procedural city; afterwards it just loads the data.
export async function POST(request: Request) {
  try {
    const user = await verifyBearer(request.headers.get("authorization"))
    const body = (await request.json()) as { name?: string; economicModel?: string; ideology?: string }
    const name = body.name?.trim() ?? ""
    const allowedModels = ["SANDBOX", "SOCIAL_MARKET", "FREE_MARKET", "PLANNED_ECONOMY", "WELFARE_STATE"]
    const allowed = ["SOCIAL_DEMOCRACY", "LIBERALISM", "CONSERVATISM", "ECOLOGISM", "LIBERTARIANISM", "SOCIALISM", "NEOLIBERALISM", "WELFARE_STATE", "FISCAL_AUSTERITY", "DEVELOPMENTALISM", "ECO_SOCIALISM", "STATE_CAPITALISM", "PROGRESSIVISM", "TECHNOCRACY"]
    if (name.length < 2 || name.length > 40 || !allowedModels.includes(body.economicModel ?? "") || !allowed.includes(body.ideology ?? "")) {
      return NextResponse.json({ message: "Nome ou ideologia inválidos." }, { status: 400 })
    }
    const result = await getOrCreateCity(user, { name, economicModel: body.economicModel as never, ideology: body.ideology as never })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ message: err.message }, { status: 401 })
    return NextResponse.json({ message: "Não foi possível criar a cidade." }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await verifyBearer(request.headers.get("authorization"))
    const result = await getOrCreateCity(user)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof CityNotCreatedError) {
      return NextResponse.json({ message: "CITY_NOT_CREATED" }, { status: 404 })
    }
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ message: err.message }, { status: 401 })
    }
    console.log("[v0] GET city error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ message: "Algo deu errado. Tente novamente." }, { status: 500 })
  }
}
