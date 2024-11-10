// Goal: Recreate NextJWTAuth without the Next.js specific parts.
// Goal: Every internal function should be a pure function.
// Constraints: Do not try to re-experiment with the typing system.

import { Config, DefaultT } from "./modules/config";
import { Context } from "./modules/context";
import { defaultUser, Providers, validateProviderId } from "./modules/providers";
import { Session } from "./modules/session";
import base from "./base"

export function AuthCore<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: Config<P, T, S>) {

  // Initialize 
  // ---------------------------------------------------------------

  const toToken = config.toToken ?? ((t) => {
    if (defaultUser in t)
      return t[defaultUser] as T
    return t as T
  })

  const toSession = config.toSession ?? ((t, updateToken) => {
    if (updateToken) updateToken(t)
    return t as S
  })

  const expiry = config.expiry ?? 1800

  const sessionStore = new Session<P, T>(
    config.session.cookieName,
    config.session.issuer,
    expiry,
    config.secret,
  )


  // Sign In
  // ---------------------------------------------------------------

  const signIn
    = async <ID extends keyof P>
      (
        id:
          ID extends string ? ID : string,
        credentials:
          P[keyof P]['fields'] extends () => infer F ? F : undefined,
        options:
          { redirectTo?: `/${string}` },
        context: Context
      ) => {
      const provider
        = validateProviderId(config.providers, id)

      const session
        = await base.signIn<P[keyof P], T, S>(
          provider,
          id,
          credentials,
          {
            redirectTo: options.redirectTo,
            callbackPath: `/${config.baseAuthURL}/callback/${id}`,
            context,
            sessionStore,
            toToken,
            toSession,
            validate: config.validate,
          }
        )

      return session
    }

  // Sign Out
  // ---------------------------------------------------------------

  const signOut
    = async (context: Context) => {
      await sessionStore.clear(context.cookie)
      return true
    }


  // Get Session
  // ---------------------------------------------------------------

  const getSession
    = async (context: Context) => {

      const { token, expired }
        = await sessionStore.get(
          context.cookie,
          context.jwt,
        )

      if (!token)
        return { session: null, error: null }

      const provider
        = validateProviderId(config.providers, token.providerId)

      let updated
        = false

      let newToken
        = token.data as Awaited<T>

      let newInternalData
        = token.internal

      if (expired) {
        newInternalData = await provider.authorize(token.internal, context)
        updated = true
      }

      const preSessionData
        = config.validate?.(token.data) ?? token.data

      const refinedSession
        = await toSession(
          preSessionData as Awaited<Awaited<T>>,
          (newToken) => {
            newToken = config.validate?.(newToken) as Awaited<T> ?? newToken
            updated = true
          }
        )

      if (updated) {
        await sessionStore.set(
          context.cookie,
          context.jwt,
          newToken,
          token.providerId,
          newInternalData
        )
      }

      return { session: refinedSession, error: null }

    }

  return {
    config,
    $Infer: {
      Token: undefined as T,
      Session: undefined as S,
    }
  }
}


