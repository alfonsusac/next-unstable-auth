import { redirect } from "next/navigation"
import { OneTimeCookieStore } from "../util/cookie"
import { OAuthProvider } from "./oauth"
import { decodeIdToken, Google as GoogleArctic } from "arctic"
import { generateNonce } from "../util/nonce"
import { InvalidParameterError } from "../util/error"
import { defaultUserAuthorizeReturn } from "../config"


export type GoogleOAuthConfig = {
  /** The client ID from Google (Get it from here: https://console.cloud.google.com/apis/credentials) */
  clientId: string,
  /** The client secret from Google (Get it from here: https://console.cloud.google.com/apis/credentials) */
  clientSecret: string
  /** The extra scopes to request from Google. Default: ["openid", "profile", "email"] */
  scopes?: string[],
  /** Enables refresh token implementation allowing user to be kept logged in */
  enableRefreshToken?: boolean
}


export const Google = (config: GoogleOAuthConfig) => {

  const oauthCsrfCookie = new OneTimeCookieStore('google-oauth-csrf', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  })
  const codeVerifierCookie = new OneTimeCookieStore('google-oauth-code-verifier', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  })
  const redirectCookie = new OneTimeCookieStore('google-oauth-redirect', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  })
  
  const google = (redirectURI: string) => new GoogleArctic(
    config.clientId,
    config.clientSecret,
    redirectURI,
  )

  return OAuthProvider({
    "initiateOAuth": async ($) => {
      const nonce = generateNonce()
      await oauthCsrfCookie.set(nonce)

      console.log(nonce)

      const codeVerifier = generateNonce()
      await codeVerifierCookie.set(codeVerifier)

      const redirectURI = $.callbackURI
      await redirectCookie.set(redirectURI)

      const stateArr = [nonce] as string[]

      const scopes = config.scopes ?? ["openid", "profile", "email"]
      if ($.context) stateArr.push($.context)

      const state = stateArr.join('|')
      const url = google($.callbackURI).createAuthorizationURL(state, codeVerifier, scopes)

      if (config.enableRefreshToken) {
        url.searchParams.set('prompt', 'consent')
        url.searchParams.set('access_type', 'offline')
      }

      console.log(url.toString())

      return redirect(url.toString())
    },
    "completeOAuth": async ($) => {

      const code = $.searchParams.get('code')
      if (!code) throw new InvalidParameterError('No code provided')

      const state = $.searchParams.get('state')
      if (!state) throw new InvalidParameterError('No state provided')

      const [csrf, context] = state.split('|')

      console.log(state, "state")
      console.log(csrf, "csrf")
      
      const storedState = await oauthCsrfCookie.use();
      console.log(storedState, "storedStaate")
      if (csrf !== storedState) throw new InvalidParameterError('Invalid state. Possible CSRF attack')

      const storedCodeVerifier = await codeVerifierCookie.use();
      if (!storedCodeVerifier) throw new InvalidParameterError('No code verifier found. Possible CSRF attack')

      const storedRedirect = await redirectCookie.use();
      if (!storedRedirect) throw new InvalidParameterError('No redirect URI found. Possible CSRF attack')
      
      const tokens = await google(storedRedirect).validateAuthorizationCode(code, storedCodeVerifier)

      console.log(tokens)

      const claims = decodeIdToken(tokens.idToken()) as GoogleTokenClaims

      console.log(claims)

      let refreshToken: string | undefined

      console.log("refresh token enabled?:", config.enableRefreshToken)

      if (config.enableRefreshToken) {
        refreshToken = tokens.refreshToken()
        console.log("REFRESHTOKEN: ", refreshToken)
      }

      return {
        data: {
          claims,
          context,
          [defaultUserAuthorizeReturn]: {
            name: claims.name,
          },
        },
        internal: {
          refreshToken
        }
      }
    },

    "refreshToken": async (internal) => {
      if (!config.enableRefreshToken) return { update: false }
      if (!internal.refreshToken) throw new InvalidParameterError('No refresh token provided. Refresh Token is enabled')
      const tokens = await google("").refreshAccessToken(internal.refreshToken);
      const refreshToken = tokens.refreshToken()
      return {
        update: true,
        internal: { refreshToken }
      }
    }
  })

}

type GoogleTokenClaims = {
  azp: string,
  aud: string,
  sub: string,
  email: string,
  email_verified: boolean,
  at_hash: string,
  name: string,
  picture: string,
  given_name: string,
  family_name: string,
}