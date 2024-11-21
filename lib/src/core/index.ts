// Goal: Recreate NextJWTAuth without the Next.js specific parts.
// Goal: Every internal function should be a pure function.
// Constraints: Do not try to re-experiment with the typing system.

import { Config, DefaultT } from "./modules/config";
import { ProviderFields, Providers } from "./modules/providers";
import base from "./base"
import { init } from "./init";
import { SignInOptions } from "./base/sign-in";
import { ParameterError } from "./modules/error";
import { validateSignInBody } from "./shared/validations";
import { getPathFromURL } from "./modules/url";



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
        options?.redirectTo ?? getPathFromURL($.requestContext.header.get('referer')),
      )
    }

  const callback
    = async () => base.callback<P, T, S>($)
  const signOut
    = async () => base.signOut($)
  const getSession
    = async () => base.getSession($)


  const getProvider
    = <ID extends keyof P>
      (
        id: ID extends string ? ID : never,
      ) => {
      return $.getProvider(id)
    }

  const createCSRF
    = () => base.createCSRF($)
  const checkCSRF
    = () => base.checkCSRF($)


  const requestHandler
    = async () => {
      const isRoute = $.requestContext.isRoute

      if (isRoute('POST /sign-in')) {
        checkCSRF()
        const id
          = $.requestContext.segments()[1]

        const provider
          = $.getProvider(id)

        if (!provider)
          throw new ParameterError('Provider not found')

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
      if (isRoute('POST /sign-out')) {
        checkCSRF()
        return signOut()
      }
      if (isRoute('GET /callback')) {
        return callback()
      }
      if (isRoute('GET /session')) {
        checkCSRF()
        return getSession()
      }
      if (isRoute('GET /provider')) {
        const id = $.requestContext.segments()[1]
        return getProvider(id)
      }
      if (isRoute('GET /csrf')) {
        return createCSRF()
      }
      return { message: "Auth Powered by NuAuth - Licensed under MIT - @alfonsusac" }
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
      Providers: undefined as unknown as P,
      Token: undefined as T,
      Session: undefined as S,
      Config: undefined as unknown as Config<P, T, S>,
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



// const auth = AuthCore({
//   expiry: 60 * 60 * 24 * 7,
//   secret: 'my-secret',
//   session: {
//     cookieName: 'my-cookie',
//     issuer: 'my-issuer',
//   },
//   providers: {
//     provider: Provider({
//       fields: () => {
//         return {
//           email: 'text',
//           password: 'text'
//         };
//       },
//       authenticate: async () => ({ data: {}, internal: {} }),
//       authorize: async () => ({ update: false })
//     })
//   },
//   authPath: "/auth",
//   jwt: {
//     sign: function (payload: any, secret: string): string {
//       throw new Error("Function not implemented.");
//     },
//     verify: function (token: string, secret: string): unknown {
//       throw new Error("Function not implemented.");
//     }
//   },
//   cookie: {
//     get: function (name: string): string | null {
//       throw new Error("Function not implemented.");
//     },
//     set: function (name: string, value: string, options?: CookieOptions): void {
//       throw new Error("Function not implemented.");
//     },
//     delete: function (name: string): void {
//       throw new Error("Function not implemented.");
//     }
//   },
//   header: {
//     get: function (name: string): string | null {
//       throw new Error("Function not implemented.");
//     },
//     set: function (name: string, value: string): void {
//       throw new Error("Function not implemented.");
//     }
//   },
//   redirect: function (url: string): never {
//     throw new Error("Function not implemented.");
//   }
// })

// auth.signIn('provider', {
//   email: 'email',
//   password: 'password'
// }, {
//   redirectTo: '/dashboard'
// })
