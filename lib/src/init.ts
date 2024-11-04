import { headers } from "next/headers"
import { Config, defaultUserAuthorizeReturn, GetDefaultJ } from "./config"
import { CookieStore, OneTimeCookieStore } from "./util/cookie"
import { InvalidConfigError, InvalidParameterError } from "./util/error"
import { redirect as next_redirect } from "next/navigation"
import { InitializedProvider, Providers } from "./providers"
import { createSessionStore, SessionStore } from "./api/session"

export type AuthUtils<
  P extends Providers = any,
  J = any,
  I = any
> = {
  authURL: string,
  sessionStore: SessionStore<J, I>
  redirectURLStore: OneTimeCookieStore
  csrfStore: OneTimeCookieStore
  redirect(url: string): never
  headers(): Promise<Pick<Awaited<Headers>, "get" | "has">>,
  validateProviderID: <ID extends string | number>(id: ID) => InitializedProvider<P[ID], ID>

}


export type AuthContext<
  P extends Providers = any,
  J = GetDefaultJ<P>,
  S = J
> = Required<Config<P, J, S>> & AuthUtils<P, J>


export function init<C extends Config>(config: C) {

  type P = C['providers']
  type J = ReturnType<NonNullable<C['toJWT']>>
  type S = ReturnType<NonNullable<C['toSession']>>
  type A = ReturnType<P[keyof P]['authorize']>

  const secret = config.secret || process.env.AUTH_SECRET
  if (!secret)
    throw new InvalidConfigError('Secret is required')

  const apiRoute = config.apiRoute || process.env.AUTH_API_ROUTE || '/api/auth'
  if (!apiRoute.startsWith('/'))
    throw new InvalidConfigError('API Route must start with /')
  if (apiRoute.endsWith('/'))
    throw new InvalidConfigError('API Route must not end with /')

  const baseURL = new URL(config.baseURL || process.env.AUTH_BASE_URL || 'http://localhost:3000').toString()

  const authURL = new URL(apiRoute, baseURL).toString()

  const providers = config.providers
  const validateProviderID = <ID extends string | number>(id: ID): InitializedProvider<P, ID> => {
    if (!id) throw new InvalidParameterError(`Provider ID is required`)
    if (!providers[id]) throw new InvalidParameterError(`Provider ${ id } not found`)
    return { ...providers[id], id }
  }

  const expiry = config.expiry || 1800

  const sessionStore = createSessionStore(expiry, secret, expiry)

  const redirectURLStore = new OneTimeCookieStore("ns-redirect", { secure: true, httpOnly: true })

  const csrfStore = new OneTimeCookieStore("ns-csrf", { secure: true, httpOnly: true })

  const toJWT = (data: A) => (config.toJWT || ((data: A) => {
    if (defaultUserAuthorizeReturn in data) {
      return data[defaultUserAuthorizeReturn]
    }
  }))(data)

  // automatic refresh token here?
  const toSession = (
    data: J,
    updateToken: (newToken: Awaited<J>) => Promise<void>
  ) => (config.toSession || ((data: J, updateToken: (newToken: Awaited<J>) => void) => data))(data, updateToken) as S

  const redirect = next_redirect

  return {

    secret,
    apiRoute,
    baseURL,
    authURL,
    providers,
    validateProviderID,
    expiry,
    toJWT,
    toSession,

    sessionStore,
    redirectURLStore,
    csrfStore,
    redirect,
    headers,

  } as AuthContext<P, J, S>

}