import { AuthContext } from "../init";
import { DefaultT } from "../modules/config";
import { Providers } from "../modules/providers";

export async function getSession<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(
  $: AuthContext<P, T, S>,
) {

  try {
    const { token, expired }
      = $.sessionStore.get()

    console.log(token)

    if (!token)
      return null

    const
      provider
        = $.getProvider(token.providerId),
      data
        = $.validate(token.data) as Awaited<T>

    let
      updated
        = false,
      updatedToken
        = data,
      updatedInternalData
        = token.internal

    if (expired) {
      const res = await provider.authorize(token.internal, $.requestCtx)
      if (res?.update) {
        updatedInternalData = res.newInternal
        updated = true
      } else {
        throw Error(`Session expired, provider ${provider.id} } did not update`)
      }
    }

    const
      updateToken
        = (newToken: Awaited<T>) => {
          updatedToken
            = newToken
          updated
            = true
        },
      session
        = await $.toSession(data, updateToken) ?? data

    if (updated)
      $.sessionStore.set(
        $.validate?.(updatedToken) as Awaited<T>,
        token.providerId,
        updatedInternalData,
      )

    return session

  } catch (error) {
    // console.error(error)
    $.sessionStore.clear()
    return null
  }
}
