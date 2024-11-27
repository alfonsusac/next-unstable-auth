import { isDate } from "node:util/types"
import { isBoolean, isDefined, isFunction, isNull, isObject, isString } from "./validation"


export type CookieOptions = {
  expires?: Date, // TODO - test this
  path?: string,
  domain?: string,
  secure?: boolean,
  sameSite?: 'strict' | 'lax' | 'none',
  httpOnly?: boolean,
}


export type CookieConfig = {
  get: (name: string) => string | null,
  set: (name: string, value: string, options?: CookieOptions) => void,
  delete: (name: string) => void,
}


export function validateCookieConfig(config: CookieConfig) {
  if (!isObject(config))
    throw new Error('Config.Cookie must be an object')
  if (!isFunction(config.get))
    throw new Error('Config.Cookie.get must be a function')
  if (!isFunction(config.set))
    throw new Error('Config.Cookie.set must be a function')
  if (!isFunction(config.delete))
    throw new Error('Config.Cookie.delete must be a function')
  return config
}



export class CookieStore {
  constructor(
    readonly cookie: CookieConfig,
    readonly name: string,
    readonly options?: CookieOptions
  ) { }
  get() {
    const value = this.cookie.get(this.name)
    if (!isNull(value) && !isString(value))
      throw new Error('Value of Cookie.get must be a string')
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

  readonly cookieStore: CookieStore

  constructor(
    cookie: CookieConfig,
    name: string,
    options?: CookieOptions,
    readonly validate?: (value: string) => boolean
  ) {
    this.cookieStore = new CookieStore(cookie, name, options)
  }
  set(value: string) {
    if (this.validate?.(value) ?? true)
      this.cookieStore.set(value)
  }
  use() {
    const value = this.cookieStore.get()
    this.cookieStore.clear()
    return value
  }
  verify(value: string | null) {
    return this.use() === value
  }
}
