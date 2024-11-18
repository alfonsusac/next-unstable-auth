import { cookies, headers } from "next/headers";
import { AuthCore } from "../core";
import { DefaultT, ToSession, ToToken, ValidateToken } from "../core/modules/config";
import { defaultUser, Provider, Providers } from "../core/modules/providers";
import { jwt } from "../util/jwt";
import { Path } from "../core/modules/request";
import { ConfigError } from "../core/modules/error";
import { getServerFunctions } from "./server-functions";
import { NextRequest, NextResponse } from "next/server";
import { redirect, RedirectType } from "next/navigation";
import { revalidatePath } from "next/cache";

export type NuAuthConfig<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
> = {
  apiRoute?: `/${ string }`,
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
}


export function NuAuth<
  P extends Providers,
  T = DefaultT<P>,
  S = T,
>(config: NuAuthConfig<P, T, S>) {

  // - - - - - - - - - - - - - - - - - - - - - - -
  // Defaults

  const secret
    = config.secret
    ?? process.env.NU_AUTH_SECRET
  if (!secret)
    throw new ConfigError('Secret is required. Please provide a secret in the config or set the NU_AUTH_SECRET environment variable')

  const authPath
    = Path(
      config.apiRoute
      ?? process.env.NEXT_PUBLIC_NU_AUTH_API_ROUTE
      ?? '/auth', 'authPath'
    )

  const expiry
    = config.expiry
      ?? process.env.NU_AUTH_EXPIRY
      ? Number(process.env.NU_AUTH_EXPIRY)
      : 60 * 60 * 24 * 7 // 1 week

  // - - - - - - - - - - - - - - - - - - - - - - -
  // Get Base Auth

  const auth = async (request?: NextRequest) => {
    const cookie
      = await cookies()
    const header
      = await headers()
    return AuthCore({
      secret,
      authPath,
      expiry,
      providers: config.providers,
      toToken: config.toToken,
      toSession: config.toSession,
      validate: config.validate,
      jwt: {
        sign: jwt.create,
        verify: jwt.verify
      },
      cookie: {
        get: (name: string) => cookie.get(name)?.value ?? null,
        set: (...params) => {
          try {
            cookie.set(...params)
          } catch (error) {
            // catch cookei set error
            console.log('error', error)
            // console.log('message', error.message)
            // console.log('name', error.name)
          }
        },
        delete: (...params) => {
          try {
            cookie.delete(...params)
          } catch (error) {
            // catch cookie set error
          }
        }
      },
      header: {
        get: header.get,
        set: header.set
      },
      redirect: (...params) => {
        console.log("REDIRECTT")
        console.log(params)
        revalidatePath(params[0], "layout")
        return redirect(params[0], RedirectType.push)
      },
      request,
    })
  }

  // - - - - - - - - - - - - - - - - - - - - - - -
  // Adapt Auth Methods

  const serverFunctions = getServerFunctions(auth)

  const routeHandlers
    = async (request: NextRequest) => {
      const $ = await auth(request)
      const data = await $.requestHandler()
      return NextResponse.json(data)
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
    }
  }
}


// - - - - - - - - - - - - - - - - - - - - - - - - 
// Playground

// const auth = NuAuth({
//   apiRoute: '/auth',
//   secret: '123',
//   providers: {
//     p1: Provider({
//       authenticate: async () => ({ data: {}, internal: {} }),
//       authorize: async () => ({ update: false })
//     }),
//     cred: Provider({
//       fields: () => ({
//         email: 'text',
//         password: 'text'
//       }),
//       authenticate: async ($) => {

//         const db: any = {}

//         // validate credentials
//         if (!$.credentials.email || !$.credentials.password)
//           throw new Error('Invalid Credentials')

//         const user = await db.authenticate($.credentials)

//         if (!user)
//           throw new Error('User not found')

//         return ({
//           data: {
//             [defaultUser]: {
//               id: user.id,
//               email: user.email,
//               name: user.name,
//               image: user.image,
//             }
//           },
//           internal: {}
//         })

//       },
//       authorize: async () => ({ update: false })
//     })
//   }
// })

// auth.signIn('p1', { redirectTo: '/a' })