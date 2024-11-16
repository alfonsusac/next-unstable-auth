import { AuthCore } from "../core";
import { SignInOptions } from "../core/base/sign-in";
import { DefaultT } from "../core/modules/config";
import { ProviderFields, Providers } from "../core/modules/providers";

export function getServerFunctions<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(
  auth: () => Promise<AuthCore<P, T, S>>
) {
  const getSession
    = async () => {
      const $
        = await auth()
      return $.getSession()
    }

  const signIn
    = async <ID extends keyof P>(
      id:
        ID extends string ? ID : never,
      ...args:
        ProviderFields<P[ID]> extends undefined
        ? [
          options?: SignInOptions
        ]
        : [
          credentials: ProviderFields<P[ID]>,
          options?: SignInOptions
        ]
    ) => {
      type PFields
        = ProviderFields<P[ID]>
      const $
        = await auth()
      const provider = $.getProvider(id)
      if (provider.hasFields) {
        if (!args[0])
          throw new Error('Credentials are required for providerId: ' + id)
        return $.signIn(id, args[0] as PFields, args[1])
      }
      return $.signIn(id, undefined as PFields, args[0])
    }

  const signOut
    = async () => {
      const $
        = await auth()
      return $.signOut()
    }

  return {
    signIn,
    signOut,
    getSession,
  }
}