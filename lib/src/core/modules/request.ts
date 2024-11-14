import { AuthContext } from "../init";
import { Config } from "./config";
import { Cookie, Header } from "./cookie";
import { JWT } from "./jwt";
import { Redirect } from "./redirect";

export function getRequestContext(
  config: Config<any, any, any>,
  request?: Request
) {
  function req() {
    if (!request)
      throw new Error('This operation requires a request object')
    return request
  }
  const pathname
    = () => req().url.split(config.hostAuthPathURL)[1].split('?')[0]
  const segments
    = () => pathname().split('/').filter(Boolean)
  const isRoute
    = (route: string) => segments()[0] === route
  const searchParams
    = () => new URL(req().url).searchParams
  const body
    = () => req().method === 'POST' ? req().json() : undefined
  const method
    = () => req().method

  return {
    segments,
    isRoute,
    searchParams,
    body,
    method,
    header: config.header,
    cookie: config.cookie,
    redirect: config.redirect,
    jwt: config.jwt,
  }
}

// export type RequestContext
//   = ReturnType<typeof getRequestContext>

export type RequestContext = {
  segments(): string[],
  isRoute(route: string): boolean,
  searchParams(): URLSearchParams,
  body(): unknown,
  method(): string,
  header: Header,
  cookie: Cookie,
  redirect: Redirect,
  jwt: JWT
}