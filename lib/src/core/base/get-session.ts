import { DefaultT, ToSession, ValidateToken } from "../modules/config";
import { Context } from "../modules/context";
import { Providers, validateProviderId } from "../modules/providers";
import { SessionStore } from "../modules/session";
import { defaultValidateToken } from "./validate-token";

export async function getSession<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(
  providers: P,
  $: {
    sessionStore: SessionStore<P, T>
    context: Context,
    validate?: ValidateToken<T>,
    toSession: ToSession<T, S> | undefined,
  }
) {
  const { token, expired }
    = await $.sessionStore.get(
      $.context.cookie,
      $.context.jwt,
    )

  if (!token)
    return null

  const provider
    = validateProviderId(providers, token.providerId)

  const unvalidatedData
    = token.data

  const validate
    = $.validate ?? defaultValidateToken

  const data
    = validate(unvalidatedData) as Awaited<T>

  let updated
    = false
  let updatedToken
    = data
  let updatedInternalData
    = token.internal

  if (expired) {
    updatedInternalData
      = await provider.authorize(token.internal, $.context)
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
    = await $.toSession?.(data, updateToken) ?? data

  if (updated)
    await $.sessionStore.set(
      $.context.cookie,
      $.context.jwt,
      $.validate?.(updatedToken) as Awaited<T>,
      token.providerId,
      updatedInternalData,
    )

  return session
}
