import { CredentialSchema, ToCredentialValues, ToCredentialValues as V } from "./credentials";
import { RequestContext } from "./request";

export type Provider
  <
    C = any,
    D extends DefaultAuthenticateData = any,
    I = any,
  > = {
    fields?: (input: unknown) => C,
    authenticate: Authenticate<C, D, I>,
    authorize: Authorize<I>,
  }

export type Authenticate
  <
    C = any,
    D = any,
    I = any
  > = (
    $: AuthenticateParameters<C>
  ) =>
    Promise<{
      data: D,
      internal: I
    }>

export type AuthenticateParameters<C> = {
  credentials: C,
  callbackURI: string,
  redirectTo: string | null,
  requestContext?: RequestContext
}

export type DefaultAuthenticateData
  = object & { [defaultUser]?: DefaultUser }

export type Authorize
  <I>
  = (
    internalData: I,
    context: RequestContext
  ) =>
    Promise<{
      update: true,
      newInternal: I
    } | {
      update: false
    }>

export type Providers = { [key in string]: Provider }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -







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



export class ProviderHandler<
  P extends Providers,
  ID extends keyof P,
> {

  provider: P[ID]

  constructor(
    providers: P,
    readonly id: ID,
    readonly callbackURI: string,
  ) {
    this.provider = validateProviderId(providers, id)
  }

  authenticate
    = async (
      {
        redirectTo,
        requestContext,
        credentials
      }: Omit<AuthenticateParameters<any>, "callbackURI">
    ) => {
      const validatedParam
        = this.provider.fields?.(credentials) ?? undefined

      return await this.provider.authenticate({
        credentials: validatedParam,
        redirectTo,
        requestContext,
        callbackURI: this.callbackURI,
      })
    }


  authorize
    = async (
      internal: any,
      context: RequestContext
    ) =>
      await this.provider.authorize(internal, context)

  $fields
    = undefined as P[ID]['fields']

  $fieldValues
    = undefined as P[ID] extends Provider<infer X> ? X : undefined
}


export type InitializedProvider<
  P extends Provider = Provider,
> = P
  & {
    id: string,
    callbackURI: string
    authorize: Parameters<P['authorize']>
  }

export type InitializedAuthenticate
  <P = any, D = any, I = any>
  = (
    $: {
      param: P,
      callbackURI: string,
      redirectTo?: string,
      requestContext?: RequestContext
    }
  ) =>
    Promise<{
      data: D,
      internal: I
    }>



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export function Provider<
  C = any,
  D extends DefaultAuthenticateData = any,
  I = any,
>(provider: Provider<C, D, I>) {
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

  return entries as { [key in Exclude<keyof P, symbol>]: InitializedProvider<P[key]> }
}



export function validateProviderId<
  P extends Providers,
  ID extends keyof P
>(providers: P, id: ID) {
  if (!(id in providers))
    throw new Error(`Invalid provider ID: ${ String(id) }`)

  const provider = providers[id]

  if (!provider)
    throw new Error(`Provider ${ String(id) } not found`)

  return provider
}



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export type ProviderCredentialValues<P extends Provider>
  = P['fields'] extends infer X
  ? X extends CredentialSchema
  ? ToCredentialValues<X> : {} : {}