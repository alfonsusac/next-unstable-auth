import { Context } from "./context";
import { CredentialSchema, ToCredentialValues, ToCredentialValues as V } from "./credentials";

export type Provider
  <
    F = any,
    D extends DefaultAuthenticateData = any,
    I = any,
  > = {
    fields?: (input: unknown) => F,
    authenticate: Authenticate<F, D, I>,
    authorize: Authorize<I>,
  }

export type Authenticate
  <P = any, D = any, I = any>
  = (
    param: P,
    context: Context & {
      callbackURI: string,
      redirectTo: string,
    }
  ) =>
    Promise<{
      data: D,
      internal: I
    }>

export type DefaultAuthenticateData
  = object & { [defaultUser]?: DefaultUser }

export type Authorize
  <I>
  = (
    internalData: I,
    context: Context
  ) =>
    Promise<{
      update: true,
      newInternal: I
    } | {
      update: false
    }>

export type Providers = { [key in string]: Provider }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export type DefaultProviderData = {
  [defaultUser]?: DefaultUser
}
export const defaultUser
  = Symbol("__defaultUser")
export const rawData
  = Symbol("__rawData")
export type DefaultUser
  = {
    id: string,
    name?: string,
    email?: string,
    image?: string,
  }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export type InitializedProvider<
  P extends Provider = Provider,
  ID extends string | number = string | number
> = P & { id: ID }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export function Provider<P extends Provider>(provider: P) {
  return provider
}



export function initializeProviders<
  P extends Providers = Providers
>(providers: P) {

  // Add the ID to each provider
  const entries = Object.fromEntries(
    Object.entries(providers).map(
      ([key, value]) => [key, { ...value, id: key }]
    )
  )

  return entries as { [key in Exclude<keyof P, symbol>]: InitializedProvider<P[key], key> }
}



export function validateProviderId<
  P extends Providers,
  ID extends keyof P
>(providers: P, id: ID) {
  if (!(id in providers)) {
    throw new Error(`Invalid provider ID: ${ String(id) }`)
  }
  return providers[id]
}



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export type ProviderCredentialValues<P extends Provider>
  = P['fields'] extends infer X
  ? X extends CredentialSchema
  ? ToCredentialValues<X> : {} : {}