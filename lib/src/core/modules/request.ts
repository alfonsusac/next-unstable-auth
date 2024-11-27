import { AuthRoutes } from "../base/routes";
import { Config } from "./config";
import { CookieConfig } from "./cookie";
import { ConfigError, ParameterError } from "./error";
import { HeaderHandler, type HeaderConfig } from "./header";
import { Redirect } from "./redirect";
import type { SessionConfig } from "./session";
import { URLString } from "./url";
import { isString } from "./validation";


export type RequestContextInput = {
  cookie: CookieConfig,
  header: HeaderConfig,
  session?: SessionConfig,
  request: Partial<Pick<Request, "method" | "json">>
  & { originURL: string },
}



export function getRequestContext($: {
  request: Config['request'],
  authURL: URLString,
  cookie: CookieConfig,
  header: HeaderHandler,
  redirect: Redirect,
}) {
  const
    authURL = new URL($.authURL),
    authPath = authURL.pathname,
    req = () => {
      if (!$.request)
        throw new ConfigError('This operation requires a request object')
      return $.request
    },
    url = () => {
      const request = req()
      if (!request.url)
        throw new ConfigError('This operation requires a URL object')
      return new URL(request.url)
    },
    method = () => req().method,
    originUrl = () => new URL(req().originURL),
    getRedirectURL = (url: string | undefined) => {
      const isProxied = originUrl().origin !== authURL.origin
      if (isProxied) {
        return new URL(url ?? '', originUrl()).toString()
      } else {
        return url ?? originUrl().pathname
      }
    },
    pathname = () => url().pathname.split(authPath)[1].split('?')[0],
    segments = () => pathname().split('/').filter(Boolean),
    isRoute = (route: AuthRoutes) => {
      try {
        if (route.split(' ')[0] !== method())
          return false
        if (route.split(' ')[1] !== `/${ segments()[0] }`)
          return false
        return true
      } catch (error) {
        return false
      }
    },
    searchParams = () => url().searchParams,
    body = async () => {
      const request = req()
      if (!request.json)
        throw new ParameterError('This operation requires a JSON body')
      try {
        return await request.json()
      } catch (error) {
        throw new ParameterError('Invalid JSON body')
      }
    }

  return {
    cookie: $.cookie,
    header: $.header,
    redirect: $.redirect,
    segments,
    isRoute,
    searchParams,
    body,
    method,
    originUrl,
    getRedirectURL,
  }
}

export function Path(input: unknown, name?: string) {
  if (!isString(input))
    throw new ConfigError(`${ name ?? input } is not a string`)
  if (!input.startsWith('/'))
    throw new ConfigError(`${ name ?? input } must start with a forward slash`)
  return input as `/${ string }`
}


export type RequestContext
  = ReturnType<typeof getRequestContext>