import { AuthContext } from "../init";
import { DefaultT } from "../modules/config";
import { Providers } from "../modules/providers";

export async function callback<
  P extends Providers,
  T = DefaultT<P>,
  S = Awaited<T>,
>(
  $: AuthContext<P, T, S>,
) {
  const provider
    = $.getProvider($.requestContext.segments()[1])

  const redirectTo
    = $.redirectStore.use()

  const { data, internal }
    = await provider.authenticate({
      credentials: undefined,
      redirectTo,
      requestContext: $.requestContext,
    })

  const rtoken
    = await $.toToken(data)

  const token
    = $.validate(rtoken) as Awaited<T>

  $.sessionStore.set(
    token,
    provider.id,
    internal
  )

  if (redirectTo)
    $.redirect(redirectTo)

  return $.toSession?.(token)
}