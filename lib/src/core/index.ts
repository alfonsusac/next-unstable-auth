// Goal: Recreate NextJWTAuth without the Next.js specific parts.
// Goal: Every internal function should be a pure function.
// Constraints: Do not try to re-experiment with the typing system.

import { Config, DefaultT } from "./modules/config";
import { Context } from "./modules/context";
import { defaultUser, Providers, validateProviderId } from "./modules/providers";
import { SessionStore } from "./modules/session";
import base from "./base"

export function AuthCore<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: Config<P, T, S>) {

  const expiry
    = config.expiry ?? 1800

  const sessionStore
    = new SessionStore<P, T>(
      config.session?.cookieName ?? 'nu-auth',
      config.session?.issuer ?? 'nu-auth',
      expiry,
      config.secret,
    )

  const signIn
    = async <ID extends keyof P>
      (
        id:
          ID extends string ? ID : string,
        credentials:
          P[keyof P]['fields'] extends () => infer F ? F : undefined,
        options:
          { redirectTo?: `/${ string }` },
        context: Context
      ) => {

      const provider
        = validateProviderId(config.providers, id)

      return await base.signIn<P[keyof P], T, S>(
        {
          provider,
          providerId: id,
          credentials,
          redirectTo: options.redirectTo,
          callbackPath: `/${ config.baseAuthURL }/callback/${ id }`,
          context,
          sessionStore,
          toToken: config.toToken,
          toSession: config.toSession,
          validate: config.validate,
        }
      )

    }

  const signOut
    = async (context: Context) => {
      await sessionStore.clear(context.cookie)
      return true
    }


  const getSession
    = async (context: Context) => {

      return await base.getSession(
        config.providers,
        {
          sessionStore,
          context,
          toSession: config.toSession,
          validate: config.validate,
        }
      )

    }

  return {
    config,
    signIn,
    signOut,
    getSession,
    $Infer: {
      Token: undefined as T,
      Session: undefined as S,
    }
  }
}


