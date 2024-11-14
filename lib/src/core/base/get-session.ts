import { AuthContext } from "../init";
import { DefaultT, ToSession, ValidateToken } from "../modules/config";
import { Providers, validateProviderId } from "../modules/providers";
import { RequestContext } from "../modules/request";
import { SessionStore } from "../modules/session";
import { defaultValidateToken } from "./default-callbacks";

export async function getSession<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(
  $: AuthContext<P, T, S>,
  $$: RequestContext,
) {

  const { token, expired }
    = $.sessionStore.get()

  if (!token)
    return null

  const provider
    = $.getProvider(token.providerId)

  const data
    = $.validate(token.data) as Awaited<T>

  let updated
    = false
  let updatedToken
    = data
  let updatedInternalData
    = token.internal

  if (expired) {
    updatedInternalData
      = await provider.authorize(token.internal, $$)
    updated
      = true
  }

  const updateToken
    = (newToken: Awaited<T>) => {
      updatedToken
        = newToken
      updated
        = true
    }

  const session
    = await $.toSession(data, updateToken) ?? data

  if (updated)
    await $.sessionStore.set(
      $.validate?.(updatedToken) as Awaited<T>,
      token.providerId,
      updatedInternalData,
    )

  return session
}
