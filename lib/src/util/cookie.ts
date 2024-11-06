import { cookies } from "next/headers"

type CookieOptions = {
  secure?: boolean
  httpOnly?: boolean
  sameSite?: "lax" | "strict" | "none"
  maxAge?: number
}

function getCookieOptions(options?: CookieOptions) {
  return {
    secure: options?.secure ?? false,
    httpOnly: options?.httpOnly ?? false,
    sameSite: options?.sameSite ?? "lax",
    maxAge: options?.maxAge ?? undefined
  }
}

export const cookie = {
  get: async (name: string) => (await cookies()).get(name)?.value,
  set: async (name: string, value: string, options: CookieOptions) => { (await cookies()).set(name, value, options) },
  clear: async (name: string) => { (await cookies()).delete(name) },
}

export class CookieStore<V> {
  constructor(
    public readonly name: string,
    public readonly param?: CookieOptions,
  ) { }
  async get() {
    const value = await cookie.get(this.name)
    return value ? JSON.parse(value) as V : undefined
  }
  async set(value: V) {
    await cookie.set(this.name, JSON.stringify(value), getCookieOptions(this.param))
  }
  async clear() {
    await cookie.clear(this.name)
  }
}

export class OneTimeCookieStore {
  constructor(
    public readonly name: string,
    public readonly param?: CookieOptions,
  ) { }
  async set(value: string) {
    console.log(this.name)
    await cookie.set(this.name, value, getCookieOptions(this.param))
  }
  async use() {
    console.log(this.name)
    const result = await cookie.get(this.name)
    console.log(result, "A")
    await cookie.clear(this.name)
    console.log(result, "B")
    return result
  }
  async verify(value?: string | null) {
    const result = await cookie.get(this.name)
    return result === value
  }
}

export function isReadonlyCookieResponseError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes("Cookies can only be modified in a Server Action or Route Handler.")
}