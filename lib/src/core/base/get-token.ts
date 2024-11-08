import { Cookie } from "../modules/cookie"
import { JWT } from "../modules/jwt"
import { Provider, Providers } from "../modules/providers"
import { InternalSession, Session } from "../modules/session"

export async function getSession<T>(
  sessionStore: Session<Providers, T>,
  cookie: Cookie,
  jwt: JWT,
) {
  const { token, expired }
    = await sessionStore.get(
      cookie,
      jwt
    )
  return { token, expired } as InternalSession<T>
}