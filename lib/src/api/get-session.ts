import { AuthContext } from "../init";
import { Providers } from "../providers";
import { InvalidParameterError } from "../util/error";

export async function getSessionFlow<
  P extends Providers,
  J,
  S,
>($: AuthContext<P, J, S>): Promise<
  { session: S | null, error: null } |
  { session: null, error: Error }
> {

  console.log("⭐️ Get Session")

  try {
    const session = await $.sessionStore.get()
    if (!session) return { session: null, error: null }

    const { token, expired } = session

    const provider = $.validateProviderID(token.providerId)
    if (!provider) throw new InvalidToken('Provider ID is invalid')

    let data = token.data
    let internal = token.internal
    let updated = false
    if (expired) {
      internal = await provider.authorize(token.internal)
      updated = true
    }
    const updateToken = async (newToken: any) => {
      data = newToken
      updated = true
    }

    const refinedSession = await $.toSession(data, updateToken)
    if (updated) {
      await $.sessionStore.set(data, token.providerId, internal)
    }
    return { session: refinedSession, error: null }

  } catch (error) {
    return { session: null, error: new InvalidToken(error) }
  }

}

export class InvalidToken extends InvalidParameterError {
  constructor(msg?: unknown) {
    super('Invalid Token: ' + msg)
  }
}