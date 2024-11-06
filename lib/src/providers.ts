import { HandlerRequestContext } from "./api/handler/context"
import { InvalidParameterError } from "./util/error"



//  Credentials 
// ----------------------------------------------------------------------------
export type CredSchemaField = {
  type: "text" | "number"
}
export type CredSchema = {
  [key: string]: CredSchemaField
}

/** ------------------------------------------------------------
    Converts a CredentialsSchema into a type that represents the values of the credentials.
    
    @example
    ```ts
    type X = CredentialsValues<{
     username: { type: "text" },
     age: { type: "number" }
    }>
    // X = {
    //   username: string,
    //   age: number
    // }
    ``` 
    ------------------------------------------------------------
    @example Default generics
    ```ts
    type Y = CredentialsValues
    // X = {
    //   [x: string]: number;
    // }
    ``` 
    */
export type CredValues<C extends CredSchema> = { [key in keyof C]: C[key]['type'] extends 'text' ? string : number }

//  Provider 
// ----------------------------------------------------------------------------
export type Provider<
  C extends CredSchema = CredSchema,
  A = any,
  I = any,
> = {
  /** The schema for the credentials that the provider requires. */
  fields?: C,
  /** The function that will be called to authenticate the user. */
  authenticate: (param: AuthenticateParams<C>) => Promise<AuthenticateReturn<A, I>>
  /** The function that will be called to authorize the user. */
  authorize: (data: I) => Promise<AuthorizeReturn<I>>
}
export const Provider = <C extends CredSchema, A, I>(params: Provider<C, A, I>) => params

export type Providers = { [key: string]: Provider }


export type AuthenticateParams<C extends CredSchema = CredSchema> = {
  /** The `credentials` provided by the user, according to the schema configured in the config. */
  credentials: C extends infer X ? CredSchema extends X ? never : { [key in keyof C]: C[key]['type'] extends 'text' ? string : number } : never // this wackjob is necessary for NextJWTAuth() config type to work
  /** The `URI` that OAuth provider will redirect to after the user has authorized the app. */
  callbackURI: string
  /** The `URI` that the user will be redirected to after the `signIn()` flow completes */
  redirectURI?: string
  /** The context that will be passed to the provider and returned after the `signIn()` flow completes */
  context?: string
  /** The `HandlerRequestContext` that will be passed to the provider when the `authenticate()` function is called from the handler. */
  handlerContext?: HandlerRequestContext
}
export type AuthenticateReturn<A = any, I = any> = {
  data: A,
  internal: I
}
export type AuthorizeReturn<I> = { update: false } | {
  update: true
  internal: I
}

export type ProviderCredentialValues<P extends Provider> =
  P['fields'] extends infer F ? CredSchema extends F ? never : F extends CredSchema ? CredValues<F> : never : never

//  Initialized Provider 
// ----------------------------------------------------------------------------
// export type InitializedProvider<
//   C extends CredSchema = CredSchema,
//   A = any,
//   I = any,
//   ID extends keyof Providers = keyof Providers
// > = Provider<C, A, I> & { id: ID }
export type InitializedProvider<
  P extends Provider = Provider,
  ID extends string | number = string | number
> = P & { id: ID }

export function initializeProviders<P extends Providers = Providers>(providers: P) {
  return Object.fromEntries(
    Object.entries(providers).map(
      ([key, value]) => [key, { ...value, id: key }]
    )
  ) as { [key in Exclude<keyof P, symbol>]: InitializedProvider<P[key], key> }
}

// export function validateProviderID<P extends Providers>(
//   providers: P,
//   id: string | number | undefined
// ): InitializedProvider {

//   if (!id) throw new InvalidParameterError(`Provider ID is required`)
//   if (!providers[id]) throw new InvalidParameterError(`Provider ${ id } not found`)
//   return { ...providers[id], id }

// }

// export function Provider<C extends CredentialsSchema, A = any>(params: Provider<C, A>) {
//   return params
// }

// type ProviderAuthorizeCredentials<C extends CredentialsSchema> =
//   C extends infer X
//   ? CredentialsSchema extends X ? any : {
//     [key in keyof C]: C[key]['type'] extends 'text'
//     ? string : number
//   } : any

// export function getProvider<P extends Providers>(providers: P, id: keyof P) {
//   const provider = providers[id]
//   if (!provider) {
//     throw new Error(`Provider ${ String(id) } not found`)
//   }
//   return provider
// }

// export type ParseProviderCredentials<
//   P extends Provider,
// > = P['credentials'] extends infer C | undefined
//   ? {
//     [K in keyof C]: C[K] extends CredSchemaField
//     ? C[K]['type'] extends "text"
//     ? string : number : never
//   } : never

// export type ParseProvidersCredentials<
//   P extends Providers,
//   ID extends keyof P
// > = CredSchema extends P[ID]['credentials']
//   ? [] : [credentials: ParseProviderCredentials<P[ID]>]





// //  Authorize Function
// // ----------------------------------------------------------------------------
// type AuthorizeFunction<
//   A = any, // Modifyable data,
//   I = any // Internal data
// > = () => Promise<{
//   data: A,
//   internal: I
// }>