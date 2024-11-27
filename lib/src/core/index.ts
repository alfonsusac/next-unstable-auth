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



export function AuthCore<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: Config<P, T, S>) {
  const
    $ = init(config),
    signIn
      = async <ID extends keyof P>
        (
          id: ID extends string ? ID : never,
          credentials: string extends ID ? (object | undefined) : ProviderFields<P[ID]>,
          options?: SignInOptions,
        ) => {
        return base.signIn(
          $,
          id,
          credentials,
          options?.redirectTo,
        )
      },
    callback = async () => base.callback($),
    signOut = async () => base.signOut($),
    getSession = async () => base.getSession($),
    getProvider
      = <ID extends keyof P>(id: ID extends string ? ID : never) => {
        return $.getProvider(id)
      },
    createCSRF = () => base.createCSRF($),
    checkCSRF = () => base.checkCSRF($),
    requestHandler
      = async () => {
        const isRoute = $.requestCtx.isRoute
        // TODO - remove this
        console.log(config.request.originURL)
        console.log("isRoute", isRoute('GET /csrf'))
        if (isRoute('POST /sign-in')) {
          checkCSRF()
          const id
            = $.requestCtx.segments()[1]

          const provider
            = $.getProvider(id)

          if (!provider)
            throw new ParameterError('Provider not found')

          const body
            = await $.requestCtx.body()

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
          const id = $.requestCtx.segments()[1]
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
    checkCSRF,
    $Infer: {
      Providers: undefined as unknown as P,
      Token: undefined as T,
      Session: undefined as S,
      Config: undefined as unknown as Config<P, T, S>,
    },
    authContext: $,
  }
}




export type AuthCore<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>
  = ReturnType<typeof AuthCore<P, T, S>>