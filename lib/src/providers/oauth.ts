// import { HandlerRequestContext } from "../api/handler/context";
// import { AuthenticateParams, AuthenticateReturn, AuthorizeReturn, CredSchema, Provider } from "../providers";

import { RequestContext } from "../core/init";
import { AuthenticateParameters, AuthenticateReturn, AuthorizeReturn, DefaultAuthenticateData, Provider } from "../core/modules/providers";

type InitiateOAuthParams
  = Omit<AuthenticateParameters<any>, "handlerContext">

export function OAuthProvider<
  A extends DefaultAuthenticateData,
  I = any
>(
  $: {
    initiateOAuth:
    (context: InitiateOAuthParams) => Promise<never>,
    completeOAuth:
    (context: RequestContext) => Promise<AuthenticateReturn<A, I>>,
    refreshToken?:
    (refreshToken: I) => Promise<AuthorizeReturn<I>>,
  }
) {
  return Provider<any, A, I>({
    authenticate:
      async (param: AuthenticateParameters<any>) => {
        if (param.requestContext.isRoute('callback')) {
          return $.completeOAuth(param.requestContext)
        }
        return $.initiateOAuth(param)
      },
    authorize:
      async (internal: I) => {
        return await $.refreshToken?.(internal)
          ?? await (async () => { return { update: false } })()
      }
  })


}



export function OAuthProvider1<A extends DefaultAuthenticateData, I = any>(
  $: {
    initiateOAuth: (context: InitiateOAuthParams) => Promise<never>,
    completeOAuth: (context: RequestContext) => Promise<AuthenticateReturn<A, I>>,
    refreshToken?: (refreshToken: I) => Promise<AuthorizeReturn<I>>,
  }
) {

  return Provider<any, A, I>({
    "authenticate": async (param: AuthenticateParameters<any>)
      : Promise<{ data: A; internal: I; }> => {

      if (!param.requestContext) {
        return await $.initiateOAuth(param)
      }
      return await $.completeOAuth(param.requestContext)
    },
    "authorize": async function (data: I)
      : Promise<AuthorizeReturn<I>> {
      return await $.refreshToken?.(data)
        ?? await (async () => { return { update: false } })()
    },
  })

}
