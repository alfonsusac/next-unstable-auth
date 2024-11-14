// Goal: Recreate NextJWTAuth without the Next.js specific parts.
// Goal: Every internal function should be a pure function.
// Constraints: Do not try to re-experiment with the typing system.

import { Config, DefaultT } from "./modules/config";
import { InitializedProvider, Provider, ProviderHandler, Providers, validateProviderId } from "./modules/providers";
import { SessionStore } from "./modules/session";
import base from "./base"
import { AuthContext, init } from "./init";
import { CookieOptions } from "./modules/cookie";
import { RequestContext } from "./modules/request";

export function AuthCore<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: Config<P, T, S>) {

  const $ = init(config)

  const signIn
    = async <ID extends keyof P>
      (
        id:
          ID extends string ? ID : never,
        credentials:
          P[ID] extends Provider<infer X> ? X : undefined,
        options?:
          { redirectTo?: `/${ string }` },
      ) => {
      return base.signIn(
        $,
        id,
        credentials,
        options?.redirectTo,
      )

    }

  const callback
    = async (rc: RequestContext) => {
      return base.callback<P, T, S>($, rc)
    }

  const signOut
    = async () => {
      await base.signOut($)
      return true
    }

  const getSession
    = async (rc: RequestContext) => {
      return base.getSession($, rc)
    }

  return {
    config,
    signIn,
    callback,
    signOut,
    getSession,
    $Infer: {
      Token: undefined as T,
      Session: undefined as S,
    }
  }
}




const auth = AuthCore({
  secret: 'my-secret',
  session: {
    cookieName: 'my-cookie',
    issuer: 'my-issuer',
  },
  providers: {
    provider: Provider({
      fields: () => {
        return {
          email: 'text',
          password: 'text'
        };
      },
      authenticate: async () => ({ data: {}, internal: {} }),
      authorize: async () => ({ update: false })
    })
  },
  hostAuthPathURL: "",
  jwt: {
    sign: function (payload: any, secret: string): string {
      throw new Error("Function not implemented.");
    },
    verify: function (token: string, secret: string): unknown {
      throw new Error("Function not implemented.");
    }
  },
  cookie: {
    get: function (name: string): string | null {
      throw new Error("Function not implemented.");
    },
    set: function (name: string, value: string, options?: CookieOptions): void {
      throw new Error("Function not implemented.");
    },
    delete: function (name: string): void {
      throw new Error("Function not implemented.");
    }
  },
  header: {
    get: function (name: string): string | null {
      throw new Error("Function not implemented.");
    },
    set: function (name: string, value: string): void {
      throw new Error("Function not implemented.");
    }
  },
  redirect: function (url: string): never {
    throw new Error("Function not implemented.");
  }
})

auth.signIn('provider', {
  email: 'email',
  password: 'password'
}, {
  redirectTo: '/dashboard'
})
