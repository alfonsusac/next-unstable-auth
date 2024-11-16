// Goal: Recreate NextJWTAuth without the Next.js specific parts.
// Goal: Every internal function should be a pure function.
// Constraints: Do not try to re-experiment with the typing system.

import { Config, DefaultT } from "./modules/config";
import { Provider, ProviderFields, ProviderHandler, Providers, validateProviderId } from "./modules/providers";
import base from "./base"
import { AuthContext, init } from "./init";
import { CookieOptions } from "./modules/cookie";
import { SignInOptions } from "./base/sign-in";
import { InvalidParameterError } from "./modules/error";
import { validateSignInBody } from "./shared/validations";



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Core


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
          string extends ID ? (object | undefined) : ProviderFields<P[ID]>,
        options?:
          SignInOptions,
      ) => {
      return base.signIn(
        $,
        id,
        credentials,
        options?.redirectTo,
      )
    }

  const callback
    = async () => {
      return base.callback<P, T, S>($)
    }

  const signOut
    = async () => {
      await base.signOut($)
      return true
    }

  const getSession
    = async () => {
      return base.getSession($)
    }

  const getProvider
    = <ID extends keyof P>
      (
        id: ID extends string ? ID : never,
      ) => {
      return $.getProvider(id)
    }

  const createCSRF
    = async () => {
      const csrf = crypto.randomUUID()
      $.csrfStore.set(csrf)
    }

  const checkCSRF
    = () => {

      const csrfHeader = $.requestContext.header.get('x-csrf-token')
      if ($.requestContext.cookie.get('csrf') !== csrfHeader)
        throw new InvalidParameterError('CSRF Token is required and is invalid')
    }

  const requestHandler
    = async () => {
      const method = $.requestContext.method()
      const path = $.requestContext.segments()[0]

      if (method === 'POST' && path === 'signin') {
        checkCSRF()
        const id
          = $.requestContext.segments()[1]

        const provider
          = $.getProvider(id)

        if (!provider)
          throw new InvalidParameterError('Provider not found')

        const body
          = await $.requestContext.body()

        const data
          = validateSignInBody(body)

        const credentials
          = provider.hasFields ? data.param_0 : undefined

        const signInOption
          = provider.hasFields ? data.param_1 : data.param_0

        return signIn(
          id,
          credentials,
          signInOption,
        )
      }
      if (method === 'POST' && path === 'signout') {
        checkCSRF()
        return signOut()
      }
      if (method === 'GET' && path === 'callback') {
        return callback()
      }
      if (method === 'GET' && path === 'session') {
        checkCSRF()
        return getSession()
      }
      if (method === 'GET' && path === 'provider') {
        const id = $.requestContext.segments()[1]
        return getProvider(id)
      }
      if (method === 'GET' && path === 'csrf') {
        return createCSRF()
      }
    }

  return {
    config,
    signIn,
    callback,
    signOut,
    getSession,
    getProvider,
    requestHandler,
    $Infer: {
      Token: undefined as T,
      Session: undefined as S,
    }
  }
}



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Types



export type AuthCore<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>
  = ReturnType<typeof AuthCore<P, T, S>>



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Testing Playgound



const auth = AuthCore({
  expiry: 60 * 60 * 24 * 7,
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
  authPath: "/auth",
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

// auth.signIn('provider', {
//   email: 'email',
//   password: 'password'
// }, {
//   redirectTo: '/dashboard'
// })
