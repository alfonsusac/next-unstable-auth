import { Cookie } from "./cookie"
import { JWT, nowInSeconds } from "./jwt"
import { Providers } from "./providers"


export type InternalToken<T = unknown, I = unknown> = {
  t: T,
  p: string,
  i: I,
  e: number,
  iat: number,
  iss: string,
}

export type InternalSession<T = unknown, I = unknown> = {
  token: {
    data: T,
    providerId: string,
    internal: I,
    expiry: number,
  },
  expired: boolean,
}


export class Session<P extends Providers, T> {
  constructor(
    readonly cookieName: string,
    readonly issuer: string,
    readonly expiry: number,
    readonly secret: string,
  ) { }

  async set(
    cookie: Cookie,
    jwt: JWT,
    token: Awaited<T>,
    providerId?: keyof P,
    internal?: any,
  ) {
    if (typeof providerId !== 'string')
      throw Error('Session.set(): invalid providerId')

    cookie.set(
      this.cookieName,
      jwt.sign(
        {
          t: token,
          p: providerId,
          i: internal,
          e: nowInSeconds() + this.expiry,
          iat: nowInSeconds(),
          iss: this.issuer,
        } satisfies InternalToken,
        this.secret
      ),
      {
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
      }
    )
  }



  async get(
    cookie: Cookie,
    jwt: JWT,
  ) {
    const token = cookie.get(this.cookieName)
    if (!token) return { token: null, expired: null }

    const session = jwt.verify(token, this.secret)
    if (!session) return { token: null, expired: null }

    if (typeof session !== "object")
      throw new InvalidSession("Invalid session")
    if ("t" in session === false || "i" in session === false || "p" in session === false || "e" in session === false || "iat" in session === false || "iss" in session === false)
      throw new InvalidSession("Invalid session")
    if (typeof session.iss !== "string" || session.iss !== this.issuer)
      throw new InvalidSession("Invalid issuer")
    if (typeof session.e !== "number")
      throw new InvalidSession("Invalid expiry")
    if (typeof session.iat !== "number")
      throw new InvalidSession("Invalid issuedAt")
    if (typeof session.p !== "string")
      throw new InvalidSession("Invalid providerId")

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



  async clear(
    cookie: Cookie,
  ) {
    cookie.delete(this.cookieName)
    return true
  }
}


class InvalidSession extends Error {
  constructor(msg: string) {
    super("Session.get(): Invalid token: " + msg)
  }
}