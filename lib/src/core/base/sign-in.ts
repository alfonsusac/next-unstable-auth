import { AuthContext } from "../init"
import { DefaultT } from "../modules/config"
import { ProviderFields, Providers } from "../modules/providers"
import { AbsolutePath, URLString } from "../modules/url"

export type SignInOptions
  = {
    redirectTo?: AbsolutePath | URLString
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
    redirectTo: SignInOptions['redirectTo'] | undefined = undefined,
  ) {
  const
    provider
      = $.getProvider(id),
    redirectDestination
      = $.requestCtx.getRedirectURL(redirectTo),
    validatedRedirectDestination
      = $.validateRedirect(redirectDestination)

  $.redirectStore.set(validatedRedirectDestination)

  const { data, internal }
    = await provider.authenticate({
      credentials,
      requestContext: $.requestCtx,
    })

  // --- might redirect and cut off here ---

  const
    rtoken
      = await $.toToken(data),
    token
      = $.validate(rtoken) as Awaited<T>

  $.sessionStore.set(
    token,
    provider.id,
    internal
  )

  // because it is useless after this point
  $.redirectStore.use()

  // use redirect URL from initial input not the one stored in redirectStore
  // because those are for redirect after user is at the callback URL.
  if (redirectTo)
    $.unsafeRedirect(redirectTo)

  return $.toSession(token)
}
