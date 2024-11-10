import { AuthContext } from "../init"
import { CredSchema, CredValues, InitializedProvider, Provider, ProviderCredentialValues, Providers } from "../providers"
import { InvalidParameterError } from "../util/error"
import { RouteHandlerContext } from "./handler/context"





export type SignInOptions = {
  /**
   * The URI that the user will be redirected to after signing in.
   * Defaults to the same page.
   */
  redirectTo?: string
  /**
   * The context that will be passed to the provider.
   */
  context?: string
}



export async function signInFlow<P extends InitializedProvider>(
  provider: P,
  credentials: ProviderCredentialValues<P>,
  { redirectTo, context }: SignInOptions,
  $: AuthContext
) {

  console.log("⭐️ Sign In Flow")

  const callbackURI = $.authURL + '/callback/' + provider.id

  if (redirectTo) {
    if (!redirectTo.startsWith('/'))
      throw new InvalidParameterError('Redirect URI must start with /')
    await $.redirectURLStore.set(redirectTo)
  }

  const { data, internal } = await provider.authenticate({
    credentials,
    callbackURI,
    redirectURI: redirectTo,
    context,
  })

  const token = await $.toJWT(data)
  await $.sessionStore.set(token, provider.id, internal)

  if (redirectTo)
    $.redirect(redirectTo)

  return await $.toSession(token)

}

// Developer's Note:
// Sign In Flow ends at the point of authorize for some providers (particularly OAuth) as they require redirecting to their site.
// It is imperative that the options are also passed to the provider's site for the redirect to work properly.
// The point below is when the flow doesn't require redirecting to the provider's site. 
// such as when using a password provider.

export async function signInCallbackFlow($: RouteHandlerContext) {

  const provider = $.validateProviderID($.segments[1])
  const callbackURI = $.authURL + '/callback/' + provider.id

  const { data, internal } = await provider.authenticate({
    credentials: {} as never,
    callbackURI,
    handlerContext: $,
  })

  const token = await $.toJWT(data)
  await $.sessionStore.set(token, provider.id, internal)

  const redirectURL = await $.redirectURLStore.use()
  return $.redirect(redirectURL ? redirectURL : '/')

}




/**
 * Validates the parameters for the signIn function for the sake of 
 * making the signIn function easier to use.
 */

export type SignInParams<
  P extends Providers = Providers,
  ID extends keyof P = string | number,
> = Providers extends P ? [ID, unknown, unknown] :
  string | number extends ID ? [ID, unknown, unknown] :
  [
    id: ID,
    ...P[ID]['fields'] extends infer C ? CredSchema extends C ? [] : [creds: C extends CredSchema ? CredValues<C> : never] : [],
    // ...P[ID]['fields'] extends infer C ?
    // CredSchema extends C ? []
    // : C extends CredSchema ? [credentials: CredValues<C>] : []
    // : [],
    options?: SignInOptions
  ]

export function validateSignInParameters<
  P extends Providers,
  ID extends string | number,
>($: AuthContext<P, any, any>, parameters: SignInParams<P, ID>): {
  provider: InitializedProvider<P[ID]>,
  credentials: ProviderCredentialValues<P[ID]>,
  options: SignInOptions
} {
  const [first, ...rest] = parameters
  const provider = $.validateProviderID(first)

  const [second, third] = rest

  if (provider.fields) {
    if (!second)
      throw new InvalidParameterError('Second Parameter: This provider requires credentials.')
    if (typeof second !== 'object')
      throw new InvalidParameterError('Second Parameter: credentials must be an object.')
    if (third && typeof third !== 'object')
      throw new InvalidParameterError('Third Parameter: options must be an object if provided.')

    // TODO - validate options
    const schema = provider.fields
    const credentialValues = second as ProviderCredentialValues<P[ID]>
    for (const key in schema) {
      if (key in second === false) {
        throw new InvalidParameterError(`Second Parameter: Missing field: ${ key }`)
      }
      if (key in second && schema[key].type === "number" && typeof credentialValues[key] !== "number") {
        throw new InvalidParameterError(`Second Parameter: Field ${ key } must be a number`)
      }
      if (key in second && schema[key].type === "text" && typeof credentialValues[key] !== "string") {
        throw new InvalidParameterError(`Second Parameter: Field ${ key } must be a number`)
      }
    }

    return {
      provider,
      credentials: credentialValues,
      options: third ?? {},
    }
  }

  if (second && typeof second !== 'object')
    throw new InvalidParameterError('Second parameter: options must be an object if provided.')

  // TODO - validate options

  return {
    provider,
    credentials: {} as ProviderCredentialValues<P[ID]>,
    options: second ?? {},
  }

}