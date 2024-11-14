export type Header = {
  get: (name: string) => string | null,
  set: (name: string, value: string) => void,
}



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



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
    readonly cookie: Cookie,
    readonly name: string,
    readonly options?: CookieOptions
  ) { }

  get() {
    return this.cookie.get(this.name)
  }

  set(value: string) {
    this.cookie.set(this.name, value, this.options)
  }

  clear() {
    this.cookie.delete(this.name)
  }

}

export class OneTimeCookieStore {
  constructor(
    readonly cookie: Cookie,
    readonly name: string,
    readonly options?: CookieOptions,
    readonly validate?: (value: string) => boolean
  ) { }

  set(value: string) {
    if (this.validate?.(value))
      this.cookie.set(this.name, value, this.options)
  }

  use() {
    const value = this.cookie.get(this.name)
    this.cookie.delete(this.name)
    return value
  }

  verify(value: string | null) {
    return this.use() === value
  }
}

// export class CookieStore {
//   constructor(
//     readonly name: string,
//     readonly options?: CookieOptions,
//   ) { }

//   get(cookie: Cookie) {
//     return cookie.get(this.name)
//   }

//   set(cookie: Cookie, value: string) {
//     cookie.set(this.name, value, this.options)
//   }

//   clear(cookie: Cookie) {
//     cookie.delete(this.name)
//   }
// }