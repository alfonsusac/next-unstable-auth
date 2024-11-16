export function validateSignInBody(body: unknown) {
  if (typeof body !== 'object')
    throw new Error('Body must be an object')
  if (!body)
    throw new Error('Body must not be null')

  if ('param_0' in body && typeof body.param_0 !== 'object')
    throw new Error('param_0 must be an object')

  if ('param_0' in body && 'param_1' in body && typeof body.param_1 !== 'string')
    throw new Error('param_1 must be a string')

  if ('param_1' in body && 'param_0' in body === false)
    throw new Error('param_0 is required if param_1 is provided')

  return body as {
    param_0?: object,
    param_1?: object,
  }
}