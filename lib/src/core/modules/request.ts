import { Config } from "./config";
import { Cookie, Header } from "./cookie";
import { ConfigError, InvalidParameterError } from "./error";
import { Redirect } from "./redirect";

const routes = {
  signIn: 'POST /sign-in',
  signOut: 'POST /sign-out',
  callback: 'GET /callback',
  csrf: 'GET /csrf',
  session: 'GET /session',
  provider: 'GET /provider',
} as const

export function getRoutes(authPath: `/${ string }`) {
  const newroutes = Object.entries(routes).reduce(
    (prev, curr, idx) => {
      const [key, value] = curr as [keyof typeof routes, string]
      prev[key] = value.replace(' ', ` ${ authPath }`)
      return prev
    }, {} as { -readonly [key in keyof typeof routes]: string })
  return newroutes as {
    readonly [key in keyof typeof routes]: `/${ string }`
  }
}

export type Routes = typeof routes[keyof typeof routes]

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