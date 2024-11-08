import { Provider } from "../modules/providers";
import { InternalSession } from "../modules/session";

export async function getSession<
  P extends Provider,
  T extends InternalSession,
>(
  token: T,
  provider: P,
) {

  let updated
    = false
  let newToken
    = token
  // let newInternalData
  //   = token.t

}