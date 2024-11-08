import { DefaultT, ToSession, ToToken, ValidateToken } from "../modules/config"
import { Context } from "../modules/context"
import { DefaultUser, defaultUser, Provider, ProviderCredentialValues, Providers } from "../modules/providers"
import { Session } from "../modules/session"

export async function signIn<
  P extends Provider,
  T = DefaultT<Providers>,
  S = Awaited<T>,
>(
  provider: P,
  $: {
    // Core provider and authentication details
    providerId: string,
    credentials: P['fields'] extends () => infer F ? F : undefined,

    // Options for customization
    options: {
      redirectTo?: string,
    },

    // Context for the request (e.g., URL, redirection handling)
    context: Context,

    // Session Management
    sessionStore?: Session<Providers, T>,

    // Optional transformations
    toToken?: ToToken<P, T>,
    toSession?: ToSession<Awaited<T>, S>,
    validateToken?: ValidateToken<T>,
  }
) {

  const { data, internal }
    = await provider.authenticate(
      $.credentials,
      {
        ...$.context,
        callbackURI: $.context.url?.toString() ?? '/',
        redirectTo: $.options.redirectTo ?? $.context.url?.toString() ?? '/',
      }
    )

  const toToken
    = $.toToken
    ?? (
      data => {
        if (defaultUser in data == false)
          throw new Error('Default User is missing in this provider, either provide a toToken() function or add a default user to the data. ProviderID: ' + $.providerId)

        return {
          token: data[defaultUser],
          validate: (token: unknown) => {

            if (typeof token !== 'object' || !token)
              throw new Error('Default User is not an object or is missing')


            if (!('id' in token && typeof token.id === 'string'))
              throw new Error('Default User ID is missing')

            if (typeof token.id !== 'string')
              throw new Error('Default User ID is not a string')

            if ('name' in token && token.id && typeof token.name !== 'string')
              throw new Error('Default User Name is not a string')

            if ('email' in token && typeof token.email !== 'string')
              throw new Error('Default User Email is not a string')

            if ('image' in token && typeof token.image !== 'string')
              throw new Error('Default User Image is not a string')

            return token as DefaultUser
          }
        }
      }
    )
  

  // const toToken
  //   = $.toToken ??
  //   ((data) => defaultUser in data ? data[defaultUser] : data)

  // const token
  //   = $.toToken
  //     ? $.validateToken?.(await $.toToken(data)) ?? await $.toToken(data)
  //     : ((data: unknown) => {
  //       if (!data)
  //         throw new Error('Authenticate Data/Token is missing')
  //       if (typeof data !== 'object')
  //         throw new Error('Authenticate Data/Token is not an object')
  //       if (defaultUser in data === false)
  //         return null

  //       const token = data[defaultUser]

  //       if (typeof token !== 'object' || !token)
  //         throw new Error('Default User is not an object or is missing')


  //       if (!('id' in token && typeof token.id === 'string'))
  //         throw new Error('Default User ID is missing')

  //       token

  //       if (typeof token.id !== 'string')
  //         throw new Error('Default User ID is not a string')

  //       if ('name' in token && token.id && typeof token.name !== 'string')
  //         throw new Error('Default User Name is not a string')

  //       if ('email' in token && typeof token.email !== 'string')
  //         throw new Error('Default User Email is not a string')

  //       if ('image' in token && typeof token.image !== 'string')
  //         throw new Error('Default User Image is not a string')

  //       return token as DefaultUser
  //     })(data)



  // const token
  //   = $.toToken
  //     ? $.validateToken?.(await $.toToken(data)) ?? await $.toToken(data)
  //     : data as Awaited<T>

  // const token
  //   = await (async () => {
  //     if ($.toToken) {
  //       const token = await $.toToken(data)
  //       return $.validateToken?.(token) ?? token
  //     } 
  //     // validate defaultUser


  //   })()


  // await $.sessionStore?.set(
  //   $.context.cookie,
  //   $.context.jwt,
  //   token,
  //   $.providerId,
  //   internal
  // )

  // if ($.options.redirectTo)
  //   $.context.redirect($.options.redirectTo)

  // const e = await $.toSession?.(token)

  // return await $.toSession?.(token) ?? token
}

type X<P extends Provider,
  T = Awaited<ReturnType<P['authenticate']>>['data'],
  S = T,> = ReturnType<typeof signIn<P, T, S>>



const e = signIn(
  Provider({
    // fields: () => {
    //   return {
    //     email: 'text',
    //     password: 'text'
    //   }
    // },
    authenticate:
      async () => (
        {
          data: {
            name: "John Doe",
          }, internal: { test: 123 }
        }
      ),
    authorize:
      async (data: { test: number }) => (
        { update: false }
      ),
  }),
  {
    // provider: ,
    providerId: 'p1',
    credentials: undefined,
    options: {
      redirectTo: '/a',
    },
    context: {} as Context,
  })