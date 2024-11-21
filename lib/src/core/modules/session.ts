import { DefaultT } from "./config"
import { CookieConfig, CookieOptions, CookieStore } from "./cookie"
import { JWT, JWTHandler, nowInSeconds } from "./jwt"
import { Providers } from "./providers"
import { isNumber, isObject, isString } from "./validation"


export type InternalToken<
  T = unknown,
  I = unknown
> = {
  t: T,
  p: string,
  i: I,
  e: number,
  iat: number,
  iss: string,
}


export type InternalSession<
  T = unknown,
  I = unknown
> = {
  token: {
    data: T,
    providerId: string,
    internal: I,
    expiry: number,
  },
  expired: boolean,
}


function validateInternalSession<T, I>(token: unknown, issuer: string) {
  if (!token)
    throw new Error("Invalid session")
  if (!isObject(token))
    throw new Error("Invalid session")
  if ("t" in token === false || "i" in token === false || "p" in token === false || "e" in token === false || "iat" in token === false || "iss" in token === false)
    throw new Error("Invalid session")
  if (!isString(token.iss) || token.iss !== issuer)
    throw new Error("Invalid issuer")
  if (!isNumber(token.e))
    throw new Error("Invalid expiry")
  if (!isNumber(token.iat) || token.iat > nowInSeconds() || token.iat > token.e)
    throw new Error("Invalid issuedAt")
  if (!isString(token.p))
    throw new Error("Invalid providerId")
  return token as InternalToken<T, I>
}


export const sessionCookieOption: CookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
} as const


export type SessionConfig = {
  cookieName?: string,
  issuer?: string,
}


export const validateSessionConfig = (cfg?: SessionConfig) => {
  const config = {
    cookieName: cfg?.cookieName ?? 'nu-auth',
    issuer: cfg?.issuer ?? 'nu-auth',
  }
  if (!isString(config.cookieName))
    throw new Error('Config.Session.CookieName must be a string')
  if (!isString(config.issuer))
    throw new Error('Config.Session.Issuer must be a string')
  return config
}


export class SessionHandler<
  P extends Providers,
  T = DefaultT<P>,
> {
  cookieStore: CookieStore
  constructor(
    readonly cookieName: string,
    readonly issuer: string,
    readonly expiry: number,
    readonly cookie: CookieConfig,
    readonly jwt: JWTHandler,
  ) {
    this.cookieStore = new CookieStore(
      this.cookie,
      this.cookieName,
      sessionCookieOption
    )
  }

  set(
    token: Awaited<T>,
    providerId: keyof P,
    internal: any,
  ) {
    if (typeof providerId !== 'string')
      throw Error('Session.set(): invalid providerId')

    const payload
      = {
        t: token,
        p: providerId,
        i: internal,
        e: nowInSeconds() + this.expiry,
        iat: nowInSeconds(),
        iss: this.issuer,
      } satisfies InternalToken

    const signed
      = this.jwt.sign(payload)

    this.cookieStore.set(signed)
  }

  get() {
    const cookie = this.cookieStore.get()
    if (!cookie) return { token: null, expired: null }
    const token = this.jwt.verify(cookie)
    const session = validateInternalSession<T, any>(token, this.issuer)
    return {
      token: {
        data: session.t,
        providerId: session.p,
        internal: session.i,
        expiry: session.e,
      },
      expired: session.e < nowInSeconds(),
    } as InternalSession<Awaited<T>>
  }

  clear() {
    this.cookieStore.clear()
    return true
  }
}