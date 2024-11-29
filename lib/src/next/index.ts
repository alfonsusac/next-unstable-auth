import { cookies, headers } from "next/headers";
import { AuthCore } from "../core";
import { DefaultT, ToSession, ToToken, ValidateToken } from "../core/modules/config";
import { Providers } from "../core/modules/providers";
import { jwt } from "../util/jwt";
import { ParameterError } from "../core/modules/error";
import { getServerFunctions } from "./server-functions";
import { NextRequest, NextResponse } from "next/server";
import { redirect as next_redirect } from "next/navigation";
import { validateURL, type URLString } from "../core/modules/url";
import { parseNumber } from "../util/parse";
import { nuAuthBaseUrlEnvKey, nuAuthSecretEnvKey } from "./env-keys";
import { isReadonlyCookieResponseError } from "../util/cookie";
import { isRedirectError } from "next/dist/client/components/redirect";

export type NuAuthConfig<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
> = {
  authURL?: URLString,
  secret?: string,
  expiry?: number,
  providers: P,
  toToken?: ToToken<P[keyof P], T>,
  toSession?: ToSession<T, S>,
  validate?: ValidateToken<T>,
  session?: {
    cookieName?: string,
    issuer?: string,
  }
  redirect?: (url: string) => string
}

export function NuAuth<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: NuAuthConfig<P, T, S>) {

  // - - - - - - - - - - - - - - - - - - - - - - -
  // Defaults

  const
    secret
      = config.secret
      ?? process.env[nuAuthSecretEnvKey]

  if (!secret)
    throw new Error(`Secret is required. Please provide a secret in the config or set the ${ nuAuthSecretEnvKey } environment variable`)

  const
    authURL
      = config.authURL
      ?? process.env[nuAuthBaseUrlEnvKey] as URLString
      ?? 'http://localhost:3000/auth' as URLString,
    expiry
      = config.expiry
      ?? parseNumber(process.env.NU_AUTH_EXPIRY, 60 * 60 * 24 * 7) // default to 1 week

  // - - - - - - - - - - - - - - - - - - - - - - -
  // Get Base Auth

  const auth = async (request?: NextRequest) => {
    const
      cookie = await cookies(),
      header = await headers(),
      referer = header.get('referer'),
      forwardedProto = header.get('x-forwarded-proto'),
      forwardedHost = header.get('x-forwarded-host'),
      origin = forwardedProto + '://' + forwardedHost

    console.log("origin: ", origin)
    console.log("referer: ", referer)
    
    try {
      validateURL(origin, "Origin URL")
    } catch (error) {
      throw new Error(`Invalid Origin URL inferred from the header. Origin must be defined in x-forwarded-proto for redirection purposes. Received proto: "${ forwardedProto }" and host "${ forwardedHost }". Error: ${ error instanceof Error ? error.message : error }`)
    }

    return AuthCore({
      secret,
      authURL,
      expiry,
      providers: config.providers,
      toToken: config.toToken,
      toSession: config.toSession,
      validate: config.validate,
      validateRedirect: config.redirect,
      jwt: {
        sign: jwt.create,
        verify: jwt.verify
      },
      header,
      cookie: {
        get:
          (name: string) => cookie.get(name)?.value ?? null,
        set:
          (...params) => {
            try { cookie.set(...params) } catch (error) {
              if (!isReadonlyCookieResponseError(error))
                throw error
            }
          },
        delete:
          (...params) => {
            try { cookie.delete(...params) } catch (error) {
              if (!isReadonlyCookieResponseError(error))
                throw error
            }
          }
      },
      redirect: (...params) => next_redirect(params[0]),
      request: {
        json: request?.json,
        method: request?.method,
        url: request?.url,
        originURL: referer ?? origin
      },
    })
  }

  // - - - - - - - - - - - - - - - - - - - - - - -
  // Adapt Auth Methods

  const serverFunctions
    = getServerFunctions(auth)

  const routeHandlers
    = async (request: NextRequest) => {
      const $ = await auth(request)
      try {

        const data = await $.requestHandler()
        return NextResponse.json(data)

      } catch (error) {
        if(isRedirectError(error)) throw error
        // TODO - clean these up
        if (process.env.NODE_ENV === 'development') {
          console.log("Error in Handler. This error message will only be shown in development environment:\n", error)
          return NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 })
        }
        if (error instanceof ParameterError)
          return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })
        if (error instanceof Error) {
          console.log("Error in Handler:\n", error)
        }
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
    }

  const middleware
    = async (request: NextRequest) => {

    }


  return {
    ...serverFunctions,
    routeHandlers,
    $Type: {
      Token: undefined as T,
      Session: undefined as S,
      Providers: undefined as unknown as P,
      Config: undefined as unknown as NuAuthConfig<P, T, S>,
    },
    context: auth
  }
}