import { DefaultUser, defaultUser, Provider, Providers } from "./providers";



export type Config<
  P extends Providers = Providers,
  T = DefaultT<P>,
  S = T,
>
  = {
    secret: string,
    baseAuthURL?: string,
    providers: P,
    session: {
      cookieName: string,
      issuer: string,
    }
    /** Expiry in seconds */
    expiry?: number,
    toToken?: ToToken<P[keyof P], T>,
    toSession?: ToSession<Awaited<T>, S>,
    validate?: ValidateToken<T>,
  }

export type ToToken<P extends Provider, T>
  = (
    data: Awaited<Promise<ReturnType<P['authenticate']>>>['data'],
  ) => T | Promise<T>

export type ToSession<T, S>
  = (
    data: Awaited<T>,
    updateToken?: (nT: T) => void
  ) => S

export type ValidateToken<T>
  = (token: unknown) => Omit<T, "">



export type DefaultT<P extends Providers | Provider>
  = P extends Providers ? DefaultT<P[keyof P]> : P['authenticate'] extends infer T ?
  T extends () => Promise<{ data: infer D }> ?
  D extends { [defaultUser]: DefaultUser } ? DefaultUser : never : never : never

