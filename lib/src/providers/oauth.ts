import { HandlerRequestContext } from "../api/handler/context";
import { AuthenticateParams, AuthenticateReturn, AuthorizeReturn, CredSchema, Provider } from "../providers";

type InitiateOAuthParams = Omit<AuthenticateParams, "handlerContext">

export function OAuthProvider<A = any, I = any>($: {
  initiateOAuth: (context: InitiateOAuthParams) => Promise<never>,
  completeOAuth: (context: HandlerRequestContext) => Promise<AuthenticateReturn<A, I>>,
  refreshToken?: (refreshToken: I) => Promise<AuthorizeReturn<I>>,
} & Omit<Provider, "authorize" | "authenticate" | "credentials">) {

  return Provider<CredSchema, A, I>({
    "authenticate": async (param: AuthenticateParams<CredSchema>): Promise<{ data: A; internal: I; }> => {
      if (!param.handlerContext) {
        return await $.initiateOAuth(param)
      }
      return await $.completeOAuth(param.handlerContext)
    },
    "authorize": async function (data: I): Promise<AuthorizeReturn<I>> {
      return await $.refreshToken?.(data)
        ?? await (async () => { return { update: false } })()
    },
  })

}
