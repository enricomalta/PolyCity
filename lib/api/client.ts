import { getIdToken } from "@/lib/firebase/auth"

// Centralized API access. No other file should build request URLs or attach
// auth headers directly — everything goes through this client so auth,
// error handling and the base URL stay in one place.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

// Normalized error codes so the UI can map them to friendly messages.
export type ApiErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "CONFLICT" | "NOT_FOUND" | "SERVER" | "NETWORK"

export class ApiError extends Error {
  code: ApiErrorCode
  status: number
  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}

const FRIENDLY: Record<ApiErrorCode, string> = {
  UNAUTHENTICATED: "Sua sessão expirou.",
  FORBIDDEN: "Você não tem autorização para executar esta ação.",
  CONFLICT: "Esta ação não é mais válida.",
  NOT_FOUND: "Recurso não encontrado.",
  SERVER: "Algo deu errado. Tente novamente.",
  NETWORK: "Não foi possível conectar ao servidor.",
}

export function friendlyMessage(code: ApiErrorCode): string {
  return FRIENDLY[code]
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED"
  if (status === 403) return "FORBIDDEN"
  if (status === 409) return "CONFLICT"
  if (status === 404) return "NOT_FOUND"
  return "SERVER"
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getIdToken()

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  // Send the Firebase ID token so the backend can authorize the request.
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch {
    throw new ApiError("NETWORK", 0, FRIENDLY.NETWORK)
  }

  if (!res.ok) {
    const code = codeForStatus(res.status)
    let message = FRIENDLY[code]
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(code, res.status, message)
  }

  // handle empty responses gracefully
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
