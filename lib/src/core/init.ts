import { defaultToToken, defaultValidateToken } from "./base/default-callbacks";
import { Config, DefaultT, ToSession, ToToken, ValidateToken } from "./modules/config";
import { CookieStore, OneTimeCookieStore } from "./modules/cookie";
import { JWTWrapper } from "./modules/jwt";
import { InitializedProvider, ProviderHandler, Providers, validateProviderId as _validateProviderId } from "./modules/providers";
import { validateRedirectTo } from "./modules/redirect";
import { getRequestContext as _getRequestContext } from "./modules/request";
import { SessionStore } from "./modules/session";

export function init<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(cfg: Config<P, T, S>) {

  const expiry
    = cfg.expiry ?? 1800

  const sessionConfig = {
    cookieName:
      cfg.session?.cookieName ?? 'nu-auth',
    issuer:
      cfg.session?.issuer ?? 'nu-auth',
  }

  const secret
    = cfg.secret

  const sessionStore
    = new SessionStore<P, T>(
      sessionConfig.cookieName,
      sessionConfig.issuer,
      expiry,
      cfg.secret,
      cfg.cookie,
      cfg.jwt,
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

  const toToken
    = cfg.toToken ?? defaultToToken

  const validate
    = cfg.validate ?? defaultValidateToken as ValidateToken<T>

  const toSession
    = cfg.toSession ?? (async (token) => token) as ToSession<T, S>

  const redirect
    = cfg.redirect

  const baseAuthURL
    = cfg.hostAuthPathURL

  const routes
    = {
    signIn: `${ baseAuthURL }/sign-in`,
    signOut: `${ baseAuthURL }/sign-out`,
    callback: `${ baseAuthURL }/callback`,
  }

  const getRequestContext
    = (request?: Request) => _getRequestContext(cfg, request)

  const getProvider
    = <ID extends keyof P>
      (
        id: ID extends string ? ID : never
      ) => {
      return new ProviderHandler<P, ID>(
        cfg.providers,
        id,
        routes.callback + `/${ id }`,
      )
    }

  return {
    expiry,
    csrfStore,
    sessionStore,
    redirectStore,
    toToken,
    validate,
    toSession,
    getRequestContext,
    getProvider,
    redirect,
    routes,
  }
}

export type AuthContext<
  P extends Providers = Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>
  = ReturnType<typeof init<P, T, S>>

