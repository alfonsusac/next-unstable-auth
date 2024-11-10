import { DefaultT, ToSession, ValidateToken } from "../modules/config";
import { Context } from "../modules/context";
import { Cookie } from "../modules/cookie";
import { JWT } from "../modules/jwt";
import { Provider, Providers, validateProviderId } from "../modules/providers";
import { InternalSession, Session } from "../modules/session";

export async function getSession<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(
  providers: P,
  $: {
    sessionStore: Session<P, T>
    cookie: Cookie,
    jwt: JWT,
    context: Context,
    validate?: ValidateToken<Awaited<T>>,
    toSession?: ToSession<T, S>,
  }
) {
  const { token, expired }
    = await $.sessionStore.get(
      $.cookie,
      $.jwt,
    )

  if (!token)
    return { session: null, error: null }

  const provider
    = validateProviderId(providers, token.providerId)

  let updated
    = false
  let newToken
    = token.data as Awaited<T>
  let newInternalData
    = token.internal

  if (expired) {
    newInternalData
      = await provider.authorize(token.internal, $.context)
    updated
      = true
  }

  const validatedToken
    = $.validate?.(token.data) as Awaited<T> ?? token.data

  const toSession
    = $.toSession ?? ((token) => token as S)

  const session
    = await $.toSession?.(
      validatedToken
    )

  


}