export type CookieOptions = {
  expires?: Date, // TODO - test this
  path?: string,
  domain?: string,
  secure?: boolean,
  sameSite?: 'strict' | 'lax' | 'none',
  httpOnly?: boolean,
}

export type Cookie = {
  get: (name: string) => string | null,
  set: (name: string, value: string, options?: CookieOptions) => void,
  delete: (name: string) => void,
}

export class CookieStore {
  constructor(
    readonly name: string,
    readonly options?: CookieOptions,
  ) { }

  get(cookie: Cookie) {
    return cookie.get(this.name)
  }

  set(cookie: Cookie, value: string) {
    cookie.set(this.name, value, this.options)
  }

  clear(cookie: Cookie) {
    cookie.delete(this.name)
  }
}