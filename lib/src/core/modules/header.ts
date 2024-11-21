import { isFunction, isNull, isObject, isString } from "./validation"


export type HeaderConfig = {
  get: (name: string) => string | null,
  set: (name: string, value: string) => void,
}


export function validateHeaderConfig(config: HeaderConfig) {
  if (!config)
    throw new Error("Header is required")
  if (!isObject(config))
    throw new Error("Header must be an object")
  if (!isFunction(config.get))
    throw new Error("Header.get must be a function")
  if (!isFunction(config.set))
    throw new Error("Header.set must be a function")
  return config
}


export class HeaderHandler {
  constructor(
    readonly header: HeaderConfig
  ) { }
  get(name: string) {
    const value = this.header.get(name)
    if (value && (!isString(value) || !isNull(value)))
      throw new Error("Invalid Header.get header value")
    return value
  }
  set(name: string, value: string) {
    this.header.set(name, value)
  }
}
