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

const InvalidCookieOptionErrorMessage = {
  NotAnObject: 'Cookie options must be an object',
  InvalidExpires: 'Cookie option "expires" must be a Date',
  InvalidPath: 'Cookie option "path" must be a string',
  InvalidDomain: 'Cookie option "domain" must be a string',
  InvalidSecure: 'Cookie option "secure" must be a boolean',
  InvalidSameSite: 'Cookie option "sameSite" must be "strict", "lax", or "none"',
  InvalidHttpOnly: 'Cookie option "httpOnly" must be a boolean',
}

function validateCookieOptions(cookieOption: unknown) {
  if (!cookieOption) return
  if (typeof cookieOption !== 'object')
    throw new Error(InvalidCookieOptionErrorMessage.NotAnObject)
  if ('expires' in cookieOption && cookieOption['expires'] instanceof Date === false)
    throw new Error(InvalidCookieOptionErrorMessage.InvalidExpires)
  if ('path' in cookieOption && typeof cookieOption['path'] !== 'string')
    throw new Error(InvalidCookieOptionErrorMessage.InvalidPath)
  if ('domain' in cookieOption && typeof cookieOption['domain'] !== 'string')
    throw new Error(InvalidCookieOptionErrorMessage.InvalidDomain)
  if ('secure' in cookieOption && typeof cookieOption['secure'] !== 'boolean')
    throw new Error(InvalidCookieOptionErrorMessage.InvalidSecure)
  if ('sameSite' in cookieOption && !['strict', 'lax', 'none'].includes((cookieOption as any)['sameSite']))
    throw new Error(InvalidCookieOptionErrorMessage.InvalidSameSite)
  if ('httpOnly' in cookieOption && typeof cookieOption['httpOnly'] !== 'boolean')
    throw new Error(InvalidCookieOptionErrorMessage.InvalidHttpOnly)
}



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



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
  ) {
    validateCookie(cookie)
    if (!name)
      throw new Error('Cookie name is required')
    validateCookieOptions(options)
  }

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



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export const CookieConfigErrorMessage = {
  MissingCookie: 'Cookie is required',
  NotAnObject: 'Cookie must be an object',
  MissingGet: 'Cookie.get must be a function',
  MissingSet: 'Cookie.set must be a function',
  MissingDelete: 'Cookie.delete must be a function',
}

export function validateCookie(cookie: unknown) {
  if (!cookie)
    throw new Error(CookieConfigErrorMessage.MissingCookie)
  if (typeof cookie !== 'object')
    throw new Error(CookieConfigErrorMessage.NotAnObject)
  if ('get' in cookie === false || typeof cookie['get'] !== 'function')
    throw new Error(CookieConfigErrorMessage.MissingGet)
  if ('set' in cookie === false || typeof cookie['set'] !== 'function')
    throw new Error(CookieConfigErrorMessage.MissingSet)
  if ('delete' in cookie === false || typeof cookie['delete'] !== 'function')
    throw new Error(CookieConfigErrorMessage.MissingDelete)
  return cookie as Cookie
}

export const HeaderConfigErrorMessage = {
  MissingHeader: 'Header is required',
  NotAnObject: 'Header must be an object',
  MissingGet: 'Header.get must be a function',
  MissingSet: 'Header.set must be a function',
}

export function validateHeader(header: unknown) {
  if (!header)
    throw new Error(HeaderConfigErrorMessage.MissingHeader)
  if (typeof header !== 'object')
    throw new Error(HeaderConfigErrorMessage.NotAnObject)
  if ('get' in header === false || typeof header['get'] !== 'function')
    throw new Error(HeaderConfigErrorMessage.MissingGet)
  if ('set' in header === false || typeof header['set'] !== 'function')
    throw new Error(HeaderConfigErrorMessage.MissingSet)
  return header as Header
}