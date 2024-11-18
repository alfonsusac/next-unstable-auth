import { Config } from "./config";
import { Cookie, Header } from "./cookie";
import { ConfigError, InvalidParameterError } from "./error";
import { Redirect } from "./redirect";

export function getRoutes(authPath: `/${ string }`) {
  return {
    signIn: `POST ${ authPath }/sign-in`,
    signOut: `POST ${ authPath }/sign-out`,
    callback: `GET ${ authPath }/callback`,
    csrf: `GET ${ authPath }/csrf`,
    session: `GET ${ authPath }/session`,
  } as const
}

export type Routes = keyof ReturnType<typeof getRoutes>

export function getRequestContext(
  request: Config<any, any, any>['request'],
  authPath: `/${ string }`,
  cookie: Cookie,
  header: Header,
  redirect: Redirect,
) {
  const req
    = () => {
      if (!request)
        throw new ConfigError('This operation requires a request object')
      return request
    }
  const method
    = () => req().method
  const url
    = () => new URL(req().url)
  const pathname
    = () => url().pathname.split(authPath)[1].split('?')[0]
  const segments
    = () => pathname().split('/').filter(Boolean)
  const isRoute
    = (route: Routes) => {
      try {
        return segments()[0] === route
      } catch (error) {
        return false        
      }
    }
  const searchParams
    = () => url().searchParams
  const body
    = async () => {
      const request = req()
      try {
        return await request.json()
      } catch (error) {
        throw new InvalidParameterError('Invalid JSON body')
      }
    }

  return {
    cookie,
    header,
    redirect,
    segments,
    isRoute,
    searchParams,
    body,
    method,
  }
}

export function Path(input: unknown, name?: string) {
  if (typeof input !== 'string')
    throw new ConfigError(`${ name ?? input } is not a string`)
  if (!input.startsWith('/'))
    throw new ConfigError(`${ name ?? input } must start with a forward slash`)
  return input as `/${ string }`
}

export type RequestContext
  = ReturnType<typeof getRequestContext>