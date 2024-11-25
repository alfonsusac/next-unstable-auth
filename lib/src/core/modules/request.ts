import { AuthRoutes } from "../base/routes";
import { Config } from "./config";
import { CookieConfig } from "./cookie";
import { ConfigError, ParameterError } from "./error";
import { HeaderHandler } from "./header";
import { processRedirectURLWithProxy, Redirect } from "./redirect";
import { PathLike, URLLike } from "./url";
import { isString } from "./validation";


export function getRequestContext($: {
  request: Config<any, any, any>['request'],
  authPath: `/${ string }`,
  cookie: CookieConfig,
  header: HeaderHandler,
  redirect: Redirect,
  baseURL: URLLike,
}) {
  const req
    = () => {
      if (!$.request)
        throw new ConfigError('This operation requires a request object')
      return $.request
    }
  const method
    = () => req().method
  const originUrl
    = () => new URL(req().originURL)
  // const getRedirectURL
  //   = (target?: URLLike | PathLike) => processRedirectURLWithProxy({
  //     baseURL: $.baseURL,
  //     originURL: originUrl().origin as URLLike,
  //     target,
  //   })
  const pathname
    = () => originUrl().pathname.split($.authPath)[1].split('?')[0]
  const segments
    = () => pathname().split('/').filter(Boolean)
  const isRoute
    = (route: AuthRoutes) => {
      try {
        if (route.split(' ')[0] !== method())
          return false
        if (route.split(' ')[1] !== `/${ segments()[0] }`)
          return false
        return true
      } catch (error) {
        return false
      }
    }
  const searchParams
    = () => originUrl().searchParams
  const body
    = async () => {
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
    // getRedirectURL,
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