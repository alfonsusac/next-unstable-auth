import { defaultToToken, defaultValidateToken } from "./base/default-callbacks";
import { Config, DefaultT, ToSession, ToToken, ValidateToken } from "./modules/config";
import { Cookie, CookieStore, OneTimeCookieStore, validateCookie, validateHeader } from "./modules/cookie";
import { ConfigError } from "./modules/error";
import { JWT, JWTWrapper, validateJWT } from "./modules/jwt";
import { InitializedProvider, ProviderHandler, Providers, validateProviderId as _validateProviderId } from "./modules/providers";
import { validateRedirectTo } from "./modules/redirect";
import { getRequestContext, getRoutes, Path } from "./modules/request";
import { SessionHandler } from "./modules/session";

export function init<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(cfg: Config<P, T, S>) {

  const expiry: unknown
    = cfg.expiry
  if (typeof expiry !== 'number')
    throw new ConfigError('Expiry must be a number')
  if (isNaN(expiry))
    throw new ConfigError('Expiry must be a number. (NaN)')
  if (expiry <= 0)
    throw new ConfigError('Expiry must be greater than 0')

  const secret: unknown
    = cfg.secret
  if (!secret)
    throw new ConfigError('Secret is required. Please provide a secret in the config or set the NU_AUTH_SECRET environment variable')
  if (typeof secret !== 'string')
    throw new ConfigError('Secret must be a string')

  const authPath = Path(cfg.authPath, 'authPath')

  const sessionConfig = {
    cookieName:
      cfg.session?.cookieName ?? 'nu-auth',
    issuer:
      cfg.session?.issuer ?? 'nu-auth',
  }

  const toToken
    = cfg.toToken ?? defaultToToken
  if (typeof toToken !== 'function')
    throw new ConfigError('toToken must be a function')

  const validate
    = cfg.validate ?? defaultValidateToken as ValidateToken<T>
  if (typeof validate !== 'function')
    throw new ConfigError('validate must be a function')

  const toSession
    = cfg.toSession ?? (async (token) => token) as ToSession<T, S>
  if (typeof toSession !== 'function')
    throw new ConfigError('toSession must be a function')

  const jwt
    = validateJWT(cfg.jwt)

  const cookie
    = validateCookie(cfg.cookie)

  const header
    = validateHeader(cfg.header)

  const sessionStore
    = new SessionHandler<P, T>(
      sessionConfig.cookieName,
      sessionConfig.issuer,
      expiry,
      secret,
      cookie,
      jwt,
    )

  const redirectStore
    = new OneTimeCookieStore(
      cfg.cookie,
      "nu-redirect",
      {
        secure: true,
        httpOnly: true
      },
      validateRedirectTo
    )

  const csrfStore
    = new OneTimeCookieStore(
      cfg.cookie,
      "nu-csrf",
      {
        secure: true,
        httpOnly: true,
      },
    )

  const redirect
    = cfg.redirect

  const routes
    = getRoutes(authPath)

  const baseURL
    = cfg.baseURL ?? (() => {

      try {
        if (cfg.request)
          return new URL(cfg.request.url).origin

        const proto = cfg.header.get('x-forwarded-proto')
        if (!proto)
          return new Error("Unable to get protocol")
        const host = cfg.header.get('x-forwarded-host')
        if (!host)
          return new Error("Unable to get host")
        return proto + '://' + host
      } catch (error) {
        const errormessage = error instanceof Error ? error.message : error
        throw new ConfigError(`Unable to infer baseURL for redirection URL from the current url from header or request. Please provide a baseURL in the config. (${ errormessage })`)
      }

    })()

  const getProvider
    = <ID extends keyof P>
      (
        id: ID extends string ? ID : never
      ) => {
      return new ProviderHandler<P, ID>(
        cfg.providers,
        id,
        // URGENT - SEPARATE METHOD AND URL
        baseURL + routes.callback.split(' ')[1] + `/${ id }`,
      )
    }

  const requestContext = getRequestContext(
    cfg.request,
    authPath,
    cookie,
    header,
    redirect,
  )

  return {
    expiry,
    csrfStore,
    sessionStore,
    redirectStore,
    toToken,
    validate,
    toSession,
    getProvider,
    redirect,
    requestContext,
  }
}

export type AuthContext<
  P extends Providers = Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>
  = ReturnType<typeof init<P, T, S>>

export type RequestContext
  = AuthContext['requestContext']