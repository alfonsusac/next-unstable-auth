import { cookies, headers } from "next/headers";
import { AuthCore } from "../core";
import { Config, DefaultT } from "../core/modules/config";
import { Provider, Providers } from "../core/modules/providers";
import { redirect as next_redirect } from "next/navigation";
import { jwt } from "../util/jwt";
import { RequestContext } from "../core/modules/request";
import { NextRequest } from "next/server";

export type NuAuthConfig<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
> = Config<P, T, S>


export function NuAuth<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: NuAuthConfig<P, T, S>) {

  const auth = AuthCore(config)

  const getContext
    = async (context?: {
      request?: NextRequest,
    }): Promise<RequestContext> => {

      const nextCookie = await cookies()
      const nextHeader = await headers()

      const req = () => {
        if (!context?.request)
          throw new Error('This operation requires a request object')
        return context.request
      }

      const pathname
        = () => req().nextUrl.pathname.split(config.hostAuthPathURL)[1].split('?')[0]
      const segments
        = () => pathname().split('/').filter(Boolean)
      
      return {
        header: nextHeader,
        cookie: {
          get:
            (name) =>
              nextCookie.get(name)?.value ?? null,
          set:
            (name, value, options) =>
              nextCookie.set(name, value, options),
          delete:
            (name) =>
              nextCookie.delete(name),
        },
        redirect:
          (url) =>
            next_redirect(url)
        ,
        jwt: {
          sign:
            (payload, secret) =>
              jwt.create(payload, secret),
          verify:
            (token, secret) =>
              jwt.verify(token, secret),
        },
        searchParams: () => req().nextUrl.searchParams,
        segments: () => req().nextUrl.pathname.split('/').filter(Boolean),
        isRoute: (route) => segments()[0] === route,
        // isRoute
        // body
        // method
      }
    }

  const getSession
    = async () => {
      const $ = await getContext()
      return auth.getSession($)
    }

  type SignInOptions = {
    redirectTo?: `/${ string }`
  }

  type PFieldSchema = P[keyof P]['fields']
  type PFields = PFieldSchema extends () => infer F ? F : undefined

  const signIn
    = async <ID extends keyof P>(
      id:
        ID extends string ? ID : string,
      ...args:
        PFields extends undefined
        ? [options: SignInOptions]
        : [credentials: PFields, options: SignInOptions]
    ) => {
      const $ = await getContext()
      if (typeof config.providers[id].fields === "function") {
        const [credentials, options] = args as [PFields, SignInOptions]
        if (!credentials) {
          throw new Error('Credentials are required for providerId: ' + id)
        }

        return auth.signIn(id, credentials, options, $)
      }

      const [options] = args as [SignInOptions]
      return auth.signIn(id, undefined as PFields, options, $)
    }

  return {
    signIn,
    getSession,
    $Type: {
      Token: undefined as T,
      Session: undefined as S,
    }
  }
}

const auth = NuAuth({
  hostAuthPathURL: 'auth',
  secret: '123',
  providers: {
    p1: Provider({

      authenticate: async () => ({ data: {}, internal: {} }),
      authorize: async () => ({ update: false })
    })
  }
})

auth.signIn('p1', { redirectTo: '/a' })