import { defaultToSession, defaultToToken, defaultValidateToken } from "./base/default-callbacks"
import { Config, DefaultT } from "./modules/config"
import { OneTimeCookieStore, validateCookieConfig } from "./modules/cookie"
import { HeaderHandler, validateHeaderConfig } from "./modules/header"
import { JWTHandler } from "./modules/jwt"
import { ProviderHandler, Providers, validateProviderId as _validateProviderId } from "./modules/providers"
import { validateRedirectTo } from "./modules/redirect"
import { getRequestContext } from "./modules/request"
import { SessionHandler, validateSessionConfig } from "./modules/session"
import { isPath, isSameOrigin, validateURL } from "./modules/url"
import { isFunction, isNumber, isObject, isString } from "./modules/validation"






export function init<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(cfg: Config<P, T, S>) {

  // # Expiry
  const expiry = cfg.expiry
  if (!isNumber(expiry))
    throw new Error('Config.Expiry must be a number')
  if (expiry <= 0)
    throw new Error('Config.Expiry must be greater than 0')


  // # Secret
  const secret = cfg.secret
  if (!isString(secret))
    throw new Error('Config.Secret must be a string')


  // # To Token
  const toToken = cfg.toToken ?? defaultToToken
  if (!isFunction(toToken))
    throw new Error('Config.ToToken must be a function')


  // # Validate
  const validate = cfg.validate ?? (cfg.toToken ? ((data: unknown) => data) : defaultValidateToken)
  if (!isFunction(validate))
    throw new Error('Config.Validate must be a function')

  // # To Session
  const toSession = cfg.toSession ?? defaultToSession
  if (!isFunction(toSession))
    throw new Error('Config.ToSession must be a function')


  // # Redirect
  const redirectFn = cfg.redirect
  if (!isFunction(redirectFn))
    throw new Error('Config.Redirect must be a function')

  const validateRedirect = cfg.validateRedirect ?? ((url: string) => {
    if (isPath(url)) return url
    if (isSameOrigin(url, authURL)) return url
    if (url.includes(new URL(authURL).origin)) return url
    throw new Error(`Redirect origin URL (${ url }) is different from the configured auth URL (${ authURL }). If this is intended, please provide a custom ValidateRedirect function. \n `)
  })
  if (!isFunction(validateRedirect))
    throw new Error('Config.ValidateRedirect must be a function')

  const redirect = cfg.redirect

  const unsafeRedirect = (url: string) => {
    const validated = validateRedirect(url)
    return redirectFn(validated)
  }

  // # JWT
  const jwtConfig = cfg.jwt
  if (!jwtConfig)
    throw new Error('Config.JWT is required')
  if (!isObject(jwtConfig))
    throw new Error('Config.JWT must be an object')
  if (!isFunction(jwtConfig.sign))
    throw new Error('Config.JWT.sign must be a function')
  if (!isFunction(jwtConfig.verify))
    throw new Error('Config.JWT.verify must be a function')
  const jwt = new JWTHandler(secret, jwtConfig)


  // # Cookie
  const cookie = validateCookieConfig(cfg.cookie)


  // # Header
  const headerConfig = validateHeaderConfig(cfg.header)
  const header = new HeaderHandler(headerConfig)


  // # Session
  const sessionConfig = validateSessionConfig(cfg.session)
  const sessionStore = new SessionHandler<P, T>(
    sessionConfig.cookieName,
    sessionConfig.issuer,
    expiry,
    cookie,
    jwt,
  )
  const redirectStore = new OneTimeCookieStore(
    cookie, "nu-redirect",
    { secure: true, sameSite:'lax', httpOnly: true },
    validateRedirectTo
  )
  const csrfStore = new OneTimeCookieStore(
    cookie, "nu-csrf",
    { secure: true, sameSite: 'lax', httpOnly: true },
  )

  // # Request Context
  const request = cfg.request
  if (!isObject(request))
    throw new Error('Config.Request must be an object')
  validateURL(request.originURL, 'Config.Request.originURL')
  if (request.method && (!isString(request.method) || !['GET', 'POST'].includes(request.method)))
    throw new Error('Config.Request.Method must be a valid HTTP method')
  if (request.json && !isFunction(request.json))
    throw new Error('Config.Request.JSON must be a function')

  // # Origin URL
  // originURL is required to construct the redirect URL after oauth authentication
  // but isn't necessary for the library to function
  const originURL = cfg.request?.originURL
  if (originURL)
    validateURL(originURL, 'Config.Request.originURL')


  // # Auth url
  // this is the main URL that all requests should point to.
  // base URL is requried to construct oauth callback URL
  const authURL = validateURL(cfg.authURL, 'Config.AuthURL')
  const authTrailingSlashURL = authURL.endsWith('/') ? authURL : authURL + '/'

  // # Providers
  const providers = cfg.providers
  if (!isObject(providers))
    throw new Error('Config.Providers must be an object')
  for (const id in providers) {
    if (!isObject(providers[id]))
      throw new Error(`Config.Providers.${ id } must be an object`)
    if (!isFunction(providers[id].authenticate))
      throw new Error(`Config.Providers.${ id }.Authenticate must be a function`)
    if (providers[id].authorize && !isFunction(providers[id].authorize))
      throw new Error(`Config.Providers.${ id }.Authorize must be a function`)
    if (providers[id].fields && !isFunction(providers[id].fields))
      throw new Error(`Config.Providers.${ id }.Fields must be a function`)
  }

  const getProvider
    = <ID extends keyof P>
      (id: ID extends string ? ID : never) => {
      return new ProviderHandler<P, ID>(
        cfg.providers,
        id,
        new URL(`callback/${ id }`, authTrailingSlashURL).toString(),
      )
    }

  const requestCtx = getRequestContext({
    request, authURL, cookie, header, redirect
  })

  return {
    expiry, authURL, csrfStore, sessionStore, redirectStore,
    toToken, validate, toSession, getProvider, redirect, unsafeRedirect,
    requestCtx, validateRedirect,
  }
}



export type AuthContext<
  P extends Providers = Providers,
  T = DefaultT<P>,
  S = Awaited<T>
>
  = ReturnType<typeof init<P, T, S>>



export type RequestContext
  = AuthContext<any, any, any>['requestCtx']
