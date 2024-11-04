import { headers } from "next/headers";
import { GetDefaultJ } from "../config";
import { AuthContext } from "../init";
import { Providers } from "../providers";
import { getSessionFlow } from "./get-session";
import { signInFlow, SignInOptions, SignInParams, validateSignInParameters } from "./sign-in";
import { signOutFlow } from "./sign-out";

export function getServerFunction<
  P extends Providers = any,
  J = GetDefaultJ<P>,
  S = J,
>($: AuthContext<P, J, S>) {

  const getSession = async () => await getSessionFlow($) as S
  const signOut = async () => await signOutFlow($)
  const signIn = async <ID extends string | number>(...params: SignInParams<P, ID>) => {
    const {
      provider,
      credentials,
      options
    } = validateSignInParameters($, params)

    const getURLFromHeaders = async () => new URL((await headers()).get('referer') ?? "https://example.com").pathname
    const redirectTo = options?.redirectTo ?? await getURLFromHeaders() ?? '/'

    return await signInFlow(provider, credentials, { ...options, redirectTo }, $)
  }

  return {
    getSession,
    signIn,
    signOut,
  }

}