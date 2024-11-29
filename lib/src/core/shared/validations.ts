import type { SignInOptions } from "../base/sign-in"

export function validateSignInBody(body: unknown, hasFields: boolean) {
  if (typeof body !== 'object')
    throw new Error('Body must be an object')
  if (!body)
    throw new Error('Body must not be null')

  // if ('param_0' in body && typeof body.param_0 !== 'object')
  //   throw new Error('param_0 must be an object')

  if (!hasFields) {
    if ('param_0' in body) {
      validateSignInOptions(body.param_0)
    }
  }

  if (hasFields) {
    if ('param_0' in body) {
      if (typeof body.param_0 !== 'object')
        throw new Error('param_0 must be an object')
    }
    if ('param_1' in body) {
      validateSignInOptions(body.param_1)
    }
  }

  return body as {
    param_0?: object,
    param_1?: object,
  }
}

function validateSignInOptions(options: unknown) {
  if (typeof options !== 'object')
    throw new Error('Options must be an object')
  if (!options)
    throw new Error('Options must not be null')

  return options as SignInOptions
}