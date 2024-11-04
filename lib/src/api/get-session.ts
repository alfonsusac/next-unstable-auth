import { AuthContext } from "../init";
import { InvalidParameterError } from "../util/error";

export async function getSessionFlow($: AuthContext) {
  const session = await $.sessionStore.get()
  if (!session) return null

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
  const refinedSession = await $.toSession(token, updateToken)
  if (updated) {
    await $.sessionStore.set(data, token.providerId, internal)
  }
  return session
}

export class InvalidToken extends InvalidParameterError {
  constructor(msg?: string) {
    super('Invalid Token: ' + msg)
  }
}