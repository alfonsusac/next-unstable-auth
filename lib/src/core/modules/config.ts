import { CookieConfig } from "./cookie";
import { HeaderConfig } from "./header";
import { JWT } from "./jwt";
import { Authenticate, DefaultUser, defaultUser, Provider, Providers } from "./providers";
import { Redirect } from "./redirect";
import { SessionConfig } from "./session";



export type Config<
  P extends Providers = Providers,
  T = DefaultT<P>,
  S = T,
>
  = {
    secret: string,
    authPath: `/${ string }`,
    authURL: string,
    providers: P,

    /** Expiry in seconds */
    expiry: number,
    toToken?: ToToken<P[keyof P], T>,
    toSession?: ToSession<T, S>,
    validate?: ValidateToken<T>,

    jwt: JWT,
    redirect: Redirect,
    
    // Despite related to request context, the lib is stateless. So, they are here.
    cookie: CookieConfig,
    header: HeaderConfig,
    session?: SessionConfig,
    request: Partial<Pick<Request, "method" | "json">>
    & { originURL: string }
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

