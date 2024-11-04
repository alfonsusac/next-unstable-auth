import { AuthContext } from "../../init";

export function getRequestContext(request: Request, authURL: string) {

  // https://example.com/api/auth/login -> '/auth/login' -> ['auth', 'login']
  const pathname = request.url.split(authURL)[1].split('?')[0]
  const segments = pathname.split('/').filter(Boolean)
  const searchParams = new URL(request.url).searchParams
  const body = request.method === 'POST' ? request.json() : undefined
  const method = request.method
  const route = segments[0]
  function defaultResponse() {
    return Response.json("Auth Powered by NextJWTAuth - Licensed under MIT - @alfonsusac")
  }
  function methodNotAllowed(method: string) {
    return Response.json({ error: `Method ${ method } not allowed` }, { status: 405 });
  }

  return {
    pathname,
    segments,
    searchParams,
    request,
    body,
    method,
    route,
    defaultResponse,
    methodNotAllowed,
  }
}

export type HandlerRequestContext = ReturnType<typeof getRequestContext>




export function getRouteHandlerContext(ctx: AuthContext, request: Request) {
  const requestCtx = getRequestContext(request, ctx.authURL)
  return {
    ...ctx,
    ...requestCtx,
  }
}

export type RouteHandlerContext = ReturnType<typeof getRouteHandlerContext>