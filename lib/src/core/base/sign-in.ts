import { InvalidParameterError, ValidationError } from "../../util/error"
import { DefaultT, ToSession, ToToken, ValidateToken } from "../modules/config"
import { Context } from "../modules/context"
import { DefaultUser, defaultUser, Provider, Providers } from "../modules/providers"
import { SessionStore } from "../modules/session"
import { defaultValidateToken } from "./validate-token"

export async function signIn<
  P extends Provider,
  T = DefaultT<Providers>,
  S = Awaited<T>,
>(
  $: {
    provider: P,
    providerId: string,
    credentials: P['fields'] extends () => infer F ? F : undefined,
    callbackPath: `/${ string }`,

    redirectTo?: `/${ string }`,

    context: Context,

    sessionStore?: SessionStore<Providers, T>,

    toToken: ToToken<P, T> | undefined,
    validate: ValidateToken<T> | undefined,

    toSession: ToSession<T, S> | undefined,
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
          throw new MissingDefaultUserError()
        return data[defaultUser] as T
      }
    )

  const validate
    = $.validate ?? defaultValidateToken

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


export class MissingDefaultUserError extends InvalidParameterError {
  constructor() {
    super('Default User is missing in this provider, either provide a toToken() function or add a [defaultUser] to the data returned from the provider.')
  }
}
