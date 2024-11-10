import { DefaultT, ToSession, ToToken, ValidateToken } from "../modules/config"
import { Context } from "../modules/context"
import { DefaultUser, defaultUser, Provider, Providers } from "../modules/providers"
import { Session } from "../modules/session"

export async function signIn<
  P extends Provider,
  T = DefaultT<Providers>,
  S = Awaited<T>,
>(
  $: {
    // Core provider and authentication details
    provider: P,
    providerId: string,
    credentials: P['fields'] extends () => infer F ? F : undefined,

    // Options for customization
    redirectTo?: `/${ string }`,
    callbackPath: `/${ string }`,

    // Request Context
    context: Context,

    // Session Management
    sessionStore?: Session<Providers, T>,

    // Optional transformations
    toToken?: ToToken<P, T>,
    toSession?: ToSession<T, S>,
    validate?: ValidateToken<T>,
  }
) {
  const callbackURI = $.context?.currentUrl?.origin + $.callbackPath

  const { data, internal }
    = await $.provider.authenticate(
      $.credentials,
      {
        ...$.context,
        callbackURI,
        redirectTo: $.redirectTo ?? $.context?.currentUrl?.toString() ?? '/',
      }
    )

  const toToken
    = $.toToken
    ?? (
      data => {
        if (defaultUser in data == false)
          throw new Error('Default User is missing in this provider, either provide a toToken() function or add a default user to the data.')

        return data[defaultUser] as T
      }
    )

  const validate
    = $.validate
    ?? (
      token => {
        if (typeof token !== 'object' || !token)
          throw new Error('Default User is not an object or is missing')

        if (!('id' in token && typeof token.id === 'string'))
          throw new Error('Default User ID is missing')

        if (typeof token.id !== 'string')
          throw new Error('Default User ID is not a string')

        if ('name' in token && token.id && typeof token.name !== 'string')
          throw new Error('Default User Name is not a string')

        if ('email' in token && typeof token.email !== 'string')
          throw new Error('Default User Email is not a string')

        if ('image' in token && typeof token.image !== 'string')
          throw new Error('Default User Image is not a string')

        return token as DefaultUser
      }
    )

  const token
    = validate(await toToken(data)) as Awaited<T>

  await $.sessionStore?.set(
    $.context.cookie,
    $.context.jwt,
    token,
    $.providerId,
    internal
  )

  if ($.redirectTo)
    $.context.redirect($.redirectTo)

  return await $.toSession?.(token) ?? token
}
