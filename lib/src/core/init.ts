import { defaultToSession, defaultToToken, defaultValidateToken } from "./base/default-callbacks";
import { getURLFromRoute } from "./base/routes";
import { Config, DefaultT } from "./modules/config";
import { OneTimeCookieStore, validateCookieConfig } from "./modules/cookie";
import { HeaderHandler, validateHeaderConfig } from "./modules/header";
import { JWTHandler } from "./modules/jwt";
import { ProviderHandler, Providers, validateProviderId as _validateProviderId } from "./modules/providers";
import { validateRedirectTo } from "./modules/redirect";
import { getRequestContext } from "./modules/request";
import { SessionHandler, validateSessionConfig } from "./modules/session";
import { isFunction, isNumber, isObject, isPath, isString } from "./modules/validation";







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


  // # AuthPath
  const authPath = cfg.authPath
  if (!isPath(authPath))
    throw new Error('Config.AuthPath must be a string and starts with /')


  // # To Token
  const toToken = cfg.toToken ?? defaultToToken
  if (!isFunction(toToken))
    throw new Error('Config.ToToken must be a function')


  // # Validate
  const validate = cfg.validate ?? defaultValidateToken
  if (!isFunction(validate))
    throw new Error('Config.Validate must be a function')


  // # To Session
  const toSession = cfg.toSession ?? defaultToSession
  if (!isFunction(toSession))
    throw new Error('Config.ToSession must be a function')


  // # Redirect
  const redirect = cfg.redirect
  if (!isFunction(redirect))
    throw new Error('Config.Redirect must be a function')


  // # JWT
  const jwtConfig = cfg.jwt
  if (!jwtConfig)
    throw new Error('Config.JWT is required')
  if (!isObject(jwtConfig))
    throw new Error('Config.JWT must be an object')
  if (!isFunction(jwtConfig.sign))
    throw new Error('Config.JWT.sign must be a function')

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
    { secure: true, httpOnly: true },
    validateRedirectTo
  )
  const csrfStore = new OneTimeCookieStore(
    cookie, "nu-csrf",
    { secure: true, httpOnly: true },
  )


  // # Base URL
  const baseURL = (() => {
    if (cfg.baseURL)
      return cfg.baseURL
    if (cfg.request)
      return new URL(cfg.request.url).origin
    try {
      const proto = header.get('x-forwarded-proto')
      if (!proto)
        return new Error("Unable to get protocol")
      const host = header.get('x-forwarded-host')
      if (!host)
        return new Error("Unable to get host")
      return proto + '://' + host
    } catch (error) {
      throw new Error(`Unable to infer baseURL for redirection URL from the current url from header or request. Please provide a baseURL in the config. (${ error instanceof Error ? error.message : error })`)
    }
  })() as `${ string }://${ string }`
  if (!isString(baseURL))
    throw new Error('Config.BaseURL must be a string')
  if (!baseURL.startsWith('http'))
    throw new Error('Config.BaseURL must start with http')
  if (!baseURL.includes('://'))
    throw new Error('Config.BaseURL must include ://')
  if (baseURL.endsWith('/'))
    throw new Error('Config.BaseURL must not end with /')
  
  if ((() => {
    try {
      new URL(baseURL)
      return false
    } catch (error) {
      return true
    }
  })()) {
    throw new Error('Config.BaseURL is not a valid URL')
  }


  // # Providers
  const getProvider
    = <ID extends keyof P>
      (id: ID extends string ? ID : never) => {
      return new ProviderHandler<P, ID>(
        cfg.providers,
        id,
        getURLFromRoute(baseURL, authPath, 'callback', id))
    }

  
  // # Request Context
  const request = cfg.request
  if (request) {
    if (!isObject(request))
      throw new Error('Config.Request must be an object')
    if (!isString(request.url))
      throw new Error('Config.Request.URL must be a string')
    if (!isString(request.method))
      throw new Error('Config.Request.Method must be a string')
    if (!isFunction(request.json))
      throw new Error('Config.Request.JSON must be a function')
  }

  const requestContext = getRequestContext(
    request,
    authPath,
    cookie,
    header,
    redirect)

  
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
  S = Awaited<T>
>
  = ReturnType<typeof init<P, T, S>>



export type RequestContext
  = AuthContext<any, any, any>['requestContext']