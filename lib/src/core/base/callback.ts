import { AuthContext } from "../init";

export async function callback(
  $: AuthContext,
) {
  const provider
    = $.getProvider($.requestContext.segments()[1])

  const redirectTo
    = $.redirectStore.use()

  const { data, internal }
    = await provider.authenticate({
      credentials: undefined,
      requestContext: $.requestContext,
    })

  const rtoken
    = await $.toToken(data)

  const token
    = $.validate(rtoken)

  $.sessionStore.set(
    token,
    provider.id,
    internal
  )

  if (redirectTo)
    $.redirect(redirectTo)

  return $.toSession?.(token)
}