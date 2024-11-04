import { Providers } from "./providers"

export type GetDefaultJ<P extends Providers> =
  ReturnType<P[keyof P]['authorize']> extends infer A
  ? A extends Promise<infer B>
  ? B extends { defaultUser: infer U }
  ? U : B : A : never

export type Config<
  P extends Providers = any,
  J = GetDefaultJ<P>,
  S = J,
> = {
  /**
   * Secret used to sign cryptographic tokens.
   * If not provided, it will try to use the environment variable AUTH_SECRET.
   */
  secret?: string,
  /**
   * The base URL of the application. (not the api route)
   */
  baseURL?: string,
  /**
   * The api route used for client API.
   * If not provided, it will try to use the environment variable AUTH_API_ROUTE.
   * Default: /api/auth
   */
  apiRoute?: string,
  /**
   * Providers that will be used for authentication.
   */
  providers: P,
  /**
   * The expiry of the JWT token in seconds.
   * Default: 30 minutes (1800 seconds)
   */
  expiry?: number
  /**
   * The callback that will be called before JWT is stored.
   */
  toJWT?: (
    data: Awaited<ReturnType<P[keyof P]['authorize']>>
  ) => J,
  /**
   * The callback that will be called to transform the JWT after it is read.
   */
  toSession?: (
    data: Awaited<J>,
    updateToken?: (newToken: Awaited<J>) => Promise<void>,
  ) => S,
}


export type InitializedConfig<
  P extends Providers = any,
  J = GetDefaultJ<P>,
  S = J,
  > = Required<Config<P, J, S>>

export const defaultUserAuthorizeReturn = Symbol("__defaultUser")