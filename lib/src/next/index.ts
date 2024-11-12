import { cookies, headers } from "next/headers";
import { AuthCore } from "../core";
import { Config, DefaultT } from "../core/modules/config";
import { Context } from "../core/modules/context";
import { CookieOptions } from "../core/modules/cookie";
import { Providers } from "../core/modules/providers";
import { redirect as next_redirect } from "next/navigation";
import { jwt } from "../util/jwt";

export type NuAuthConfig
  <
    P extends Providers,
    T = DefaultT<P>,
    S = T,
  >
  = Config<P, T, S>


export function NuAuth<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: NuAuthConfig<P, T, S>) {

  const auth = AuthCore(config)


  const getContext = async (context?: {
    request?: Request,
    searchParams?: URLSearchParams,
    currentUrl?: URL,
  }): Promise<Context> => {

    const cookie = await cookies()
    const header = await headers()

    return {
      cookie: {
        get:
          (name) =>
            cookie.get(name)?.value ?? null,
        set:
          (name, value, options) =>
            cookie.set(name, value, options),
        delete:
          (name) =>
            cookie.delete(name),
      },
      headers: header,
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
      request: context?.request,
      searchParams: context?.searchParams,
      currentUrl: context?.currentUrl,
    }
  }

  const getSession = async () => {

    const $ = await getContext()
    return auth.getSession($)
  }



  return {

    getSession: auth.getSession,
    $Type: {
      Token: undefined as T,
      Session: undefined as S,
    }
  }
}