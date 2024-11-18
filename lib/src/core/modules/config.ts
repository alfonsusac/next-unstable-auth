import { Cookie, Header } from "./cookie";
import { JWT } from "./jwt";
import { Authenticate, DefaultUser, defaultUser, Provider, Providers } from "./providers";
import { Redirect } from "./redirect";



export type Config<
  P extends Providers = Providers,
  T = DefaultT<P>,
  S = T,
>
  = {
    secret: string,
    authPath: `/${ string }`,
    providers: P,

    /** Expiry in seconds */
    expiry: number,
    toToken?: ToToken<P[keyof P], T>,
    toSession?: ToSession<T, S>,
    validate?: ValidateToken<T>,

    jwt: JWT,
    cookie: Cookie,
    header: Header,
    redirect: Redirect,

    request?: Pick<Request, "url" | "method" | "json">
    session?: {
      cookieName?: string,
      issuer?: string,
    }
    baseURL?: string,

  }


export type ToToken
  <P extends Provider, T>
  = (
    data: Awaited<Promise<ReturnType<P['authenticate']>>>['data'],
  ) => T | Promise<T>


export type ToSession
  <T, S>
  = (
    data: Awaited<T>,
    updateToken?: (nT: Awaited<T>) => void
  ) => S


export type ValidateToken<T>
  = (token: unknown) => NoInfer<T>

export type DefaultT<P extends Providers | Provider>
  =
  P extends Providers ?
  DefaultT<P[keyof P]> : P['authenticate'] extends infer T ?
  T extends Authenticate<infer _, infer D> ?
  D extends { [defaultUser]: DefaultUser } ?
  DefaultUser
  : D
  : never // not authenticate - impossible
  : never // P['authenticate'] somehow doesn't exist - impossible

