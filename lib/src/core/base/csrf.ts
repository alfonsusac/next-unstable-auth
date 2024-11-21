import { AuthContext } from "../init"
import { ParameterError } from "../modules/error"
import { generateNonce } from "../modules/nonce"

export function createCSRF(
  $: AuthContext,
) {
  const csrf = generateNonce()
  $.csrfStore.set(csrf)
  return csrf
}

export async function checkCSRF(
  $: AuthContext,
) {
  const header = $.requestContext.header
  const cookie = $.requestContext.cookie

  const csrfHeader = header.get('x-csrf-token')
  if (cookie.get('csrf') !== csrfHeader)
    throw new CSRFError()
}

export class CSRFError extends ParameterError {
  constructor() {
    super('CSRF Token is invalid')
  }
}