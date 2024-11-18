import { AuthContext } from "../init"
import { DefaultT } from "../modules/config"
import { ProviderFields, Providers } from "../modules/providers"
import { RequestContext } from "../modules/request"

export type SignInOptions
  = {
    redirectTo?: `/${ string }`
  }

export async function signIn
  <
    P extends Providers,
    ID extends keyof P,
    T = DefaultT<Providers>,
    S = Awaited<T>,
  >(
    $: AuthContext<P, T, S>,
    id: ID extends string ? ID : never,
    credentials: ID extends string ? (object | undefined) : ProviderFields<P[ID]>,
    redirectTo: SignInOptions['redirectTo'] | null = null,
) {
  const provider
    = $.getProvider(id)

  if (redirectTo)
    $.redirectStore.set(redirectTo)

  const { data, internal }
    = await provider.authenticate({
      credentials,
      redirectTo,
      requestContext: $.requestContext,
    })

  // --- might redirect and cut off here ---

  const rtoken
    = await $.toToken(data)

  const token
    = $.validate(rtoken) as Awaited<T>

  $.sessionStore.set(
    token,
    provider.id,
    internal
  )

  $.redirectStore.use()

  if (redirectTo)
    $.redirect(redirectTo)

  return $.toSession(token)
}
