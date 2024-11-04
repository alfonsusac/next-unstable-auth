import { isReadonlyCookieResponseError } from "../util/cookie"
import { jwt } from "../util/jwt"
import { cookies } from "next/headers"

type InternalSessionData<J, I> = {
  t: J,
  p: string | number,
  i: I,
  e: number,
}

type InternalSession<J, I> = InternalSessionData<J, I> & {
  iss?: string // issuer
  iat?: number // issued at
}

export type SessionStore<J, I> = ReturnType<typeof createSessionStore<J, I>>

export const createSessionStore = <J, I>(expiry: number, secret: string, cookieExpiry: number) => {

  const sessionStore = {

    "set": async (
      data: Awaited<J>,
      providerId: string | number,
      internal: Awaited<I>,
      overrideExpiry: number = expiry
    ) => {
      const internalSessionData: InternalSession<J, I> = {
        t: data,
        p: providerId,
        i: internal,
        e: Math.floor(Date.now() / 1000) + overrideExpiry,
        iss: "nextjwtauth",
        iat: Math.floor(Date.now() / 1000),
      }
      const token = jwt.create(internalSessionData, secret)
      const cookie = await cookies()
      try {
        cookie.set("ns-auth", token, {
          secure: true,
          httpOnly: true,
          sameSite: "strict",
        })
      } catch (error) {
        if (!isReadonlyCookieResponseError(error)) throw error
      }
    },

    "clear": async () => {
      const cookie = await cookies()
      try {
        cookie.delete("ns-auth")
      } catch (error) {
        if (!isReadonlyCookieResponseError(error)) throw error
      }
      return true
    },

    "get": async () => {
      const cookie = await cookies()
      const token = cookie.get("ns-auth")?.value
      if (!token) return null
      try {
        const internalSessionToken = jwt.verify(token, secret) as InternalSession<J, I>
        // TODO - sanitize the token
        let expired = false
        if (internalSessionToken.e < Math.floor(Date.now() / 1000)) {
          expired = true
        }
        return {
          token: {
            data: internalSessionToken.t,
            providerId: internalSessionToken.p,
            internal: internalSessionToken.i,
            expiry: internalSessionToken.e,
          },
          expired,
        }
      } catch (error) {
        console.log("Something went wrong in sessionStore.get()", error)
        throw error
      }
    }

  }
  return sessionStore
}