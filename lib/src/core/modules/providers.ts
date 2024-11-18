import { RequestContext } from "./request";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Primary Provider functions



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

export type Providers = { [key in string]: Provider }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Authenticate
 


export type Authenticate
  <
    C = any,
    D = any,
    I = any
  > = (
    $: AuthenticateParameters<C>
  ) =>
    Promise<AuthenticateReturn<D, I>>

export type AuthenticateReturn<D, I>
  = {
    data: D,
    internal: I
  }

export type AuthenticateParameters<C>
  = {
    credentials: C,
    callbackURI: string,
    redirectTo: string | null,
    requestContext: RequestContext
  }

export type DefaultAuthenticateData
  = object & { [defaultUser]?: DefaultUser }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Authorize



export type Authorize
  <I>
  = (
    internalData: I,
    context: RequestContext
  ) =>
    Promise<AuthorizeReturn<I>>

export type AuthorizeReturn<I>
  = {
    update: true,
    newInternal: I
  } | {
    update: false
  }

export type AuthorizeParameter<I>
  = [
    internalData: I,
    context: RequestContext
  ]



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Provider fields



export type ProviderFields
  <P extends Provider>
  = P['fields'] extends infer X ? (
    X extends (input: unknown) => infer A ? any extends A ? undefined : A : never
  ) : never



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Default Provider Data & Default symbols



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
// Provider Handler - initializes providers



export class ProviderHandler<
  P extends Providers,
  ID extends keyof P,
> {

  provider: P[ID]
  hasFields: boolean

  constructor(
    providers: P,
    readonly id: ID,
    readonly callbackURI: string,
  ) {
    this.provider = validateProviderId(providers, id)
    this.hasFields = !!this.provider.fields
  }

  authenticate
    = async (
      {
        redirectTo,
        requestContext,
        credentials
      }: Omit<AuthenticateParameters<any>, "callbackURI">
    ) => {

      if (this.hasFields && !credentials)
        throw new Error("Credentials required for this provider")

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
// Utility functions



export function Provider<
  C = any,
  D extends DefaultAuthenticateData = any,
  I = any,
>(provider: Provider<C, D, I>) {
  return provider
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


