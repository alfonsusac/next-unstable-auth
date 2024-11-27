import { AuthContext } from "../init"
import { ParameterError } from "../modules/error"
import { generateNonce } from "../modules/nonce"

export function createCSRF(
  $: AuthContext,
) {
  const csrf = generateNonce()
  console.log("Hello? A")
  $.csrfStore.set(csrf)
  console.log("Hello? B")
  return csrf
}

export async function checkCSRF(
  $: AuthContext,
) {
  const
    csrfHeader
      = $.requestCtx.header.get('x-csrf-token')
  if (!csrfHeader)
    throw new CSRFError()
  if (!$.csrfStore.verify(csrfHeader))
    throw new CSRFError()
}

export class CSRFError extends ParameterError {
  constructor() {
    super('CSRF Token is invalid')
  }
}