import { AuthContext } from "../init";
import { Providers } from "../providers";
import { getSessionFlow } from "./get-session";
import { signInFlow, SignInOptions, SignInParams, validateSignInParameters } from "./sign-in";
import { signOutFlow } from "./sign-out";

export function getServerFunction<
  P extends Providers,
  J,
  S,
>($: AuthContext<P, J, S>) {

  const getSession = async () => await getSessionFlow($)
  const signOut = async () => await signOutFlow($)
  const signIn = async <ID extends keyof P>(...params: SignInParams<P, ID extends symbol ? never : ID>) => {
    const {
      provider,
      credentials,
      options
    } = validateSignInParameters($, params)

    return await signInFlow(provider, credentials, options, $)
  }

  return {
    getSession,
    signIn,
    signOut,
  }

}