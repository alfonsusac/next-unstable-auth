import { expect, test, describe, beforeEach, it, vi, beforeAll } from 'vitest'
import { NuAuth } from '../next'
import { NextRequest } from 'next/server'


vi.mock('next/headers', () => ({
  cookies: async () => {
    return {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    }
  },
  headers: async () => {
    return {
      get: vi.fn((name: string) => {
        if (name === "x-forwarded-proto") return 'http'
        if (name === "x-forwarded-host") return 'localhost:3000'
        if (name === "referer") return 'http://localhost:3000'
        return "ASD"
      }),
      set: vi.fn((name: string, value: string) => { }),
      clear: vi.fn((name: string) => { })
    }
  }
}))

describe('NextJS Layer', () => {
  describe('Configuration', () => {
    describe('Secret', () => {
      describe('is not provided', () => {
        it('should throw error', () => {
          expect(() => NuAuth({ providers: {} })).toThrowError('Secret is required')
        })
      })
      describe('provided by config', () => {
        it('should not throw error', () => {
          expect(() => NuAuth({ secret: '123', providers: {} })).not.toThrowError()
        })
      })
      describe('provided by environment vairable', () => {
        it('should not throw error', () => {
          vi.stubEnv('NU_AUTH_SECRET', '123')
          expect(() => NuAuth({ providers: {} })).not.toThrowError()
        })
      })
    })

    describe('API URL', () => {
      describe('is not provided', () => {
        it('should be set to /auth by default', async () => {
          const authURL = (await NuAuth({ providers: {} }).context()).config.authURL
          expect(authURL).toEqual('http://localhost:3000/auth')
        })
      })
      describe('provided by config', () => {
        it('should be set to the provided value', async () => {
          const authURL = (await NuAuth({ authURL: 'http://localhost:4000/auth', providers: {} }).context()).config.authURL
          expect(authURL).toEqual('http://localhost:4000/auth')
        })
        it('should throw error if invalid', async () => {
          await expect(NuAuth({ authURL: '://localhost:3000', providers: {} }).context(new NextRequest('https://www.acme.com'))).rejects.toThrowError('Config.AuthURL must start with http.')
        })
      })
      describe('provided by environment variable', () => {
        it('should be set to the provided value', async () => {
          vi.stubEnv('NU_AUTH_URL', 'http://localhost:4000/auth')
          const authURL = (await NuAuth({ providers: {} }).context()).config.authURL
          expect(authURL).toEqual('http://localhost:4000/auth')
        })
        it('should throw error if invalid', async () => {
          vi.stubEnv('NU_AUTH_URL', '')
          await expect(NuAuth({ providers: {} }).context(new NextRequest('https://www.acme.com'))).rejects.toThrowError('Config.AuthURL must start with http.')
        })
      })
    })

    // describe('expiry', () => {

    // })
  })
})






















// // Mock 
// // ------------------------------------------------------------------------
// const mockCookieStorage: Record<string, string> = {}

// vi.mock('next/headers', () => ({
//   cookies: async () => {
//     return {
//       get: vi.fn((name: string) => {
//         return {
//           value: mockCookieStorage[name],
//           key: name,
//         }
//       }),
//       set: vi.fn((name: string, value: string) => {
//         mockCookieStorage[name] = value
//       }),
//       delete: vi.fn((name: string) => {
//         delete mockCookieStorage[name]
//       })
//     }
//   },
//   headers: async () => {
//     return {
//       get: vi.fn((name: string) => { }),
//       set: vi.fn((name: string, value: string) => { }),
//       clear: vi.fn((name: string) => { })
//     }
//   }
// }))

// // vi.mock('next/navigation', () => ({
// //   redirect: () => {
// //     throw new Error('test')
// //   }
// // }))

// const mockSecret = "123"

// export const InitializeNextJWTAuth = () => NextJWTAuth({
//   secret: mockSecret,
//   providers: {
//     passwordless: Provider({
//       authenticate: async () => {
//         return {
//           data: {
//             name: "John Doe"
//           },
//           internal: {
//             test: 123,
//           }
//         }
//       },
//       authorize: async () => ({ update: false })
//     }),
//     passwordlessRedirect: Provider({
//       authenticate: async ({ handlerContext }) => {
//         if (handlerContext) {
//           return {
//             data: {
//               name: "Mary Jane"
//             },
//             internal: {
//               test: 456,
//             }
//           }
//         }
//         redirect('/something')
//       },
//       authorize: async () => ({ update: false })
//     }),
//     hello: Provider({
//       fields: {
//         email: {
//           type: 'text',
//         },
//         password: {
//           type: 'text',
//         }
//       },
//       authenticate: async ({ credentials }) => {
//         if (credentials.email === 'Jane Doe' && credentials.password === '123') {
//           return {
//             data: {
//               name: "Jane Doe"
//             },
//             internal: {
//               test: 789,
//             }
//           }
//         }
//         throw new Error('Invalid credentials')
//       },
//       authorize: async () => ({ update: false })
//     })

//   }
// })


// // Scenarios 
// // ------------------------------------------------------------------------
// describe('auth using server functions', () => {
//   beforeEach(() => {
//     Object.keys(mockCookieStorage).forEach(key => delete mockCookieStorage[key]);
//   })
//   it('passwordless, no redirect', async () => {
//     const auth = InitializeNextJWTAuth()

//     const result = await auth.signIn('passwordless')
//     expect(result).toEqual({ name: "John Doe" })

//     const token = jwt.verify(mockCookieStorage['ns-auth'], mockSecret)
//     expect(token.i).toEqual({ test: 123 })
//     expect(token.iss).toEqual("nextjwtauth")
//     expect(token.p).toEqual("passwordless")
//     expect(token.t).toEqual({ name: "John Doe" })

//     const session = await auth.getSession()
//     expect(session).toEqual({ name: "John Doe" })

//     await auth.signOut()
//     expect(mockCookieStorage['ns-auth']).toBeUndefined()

//     const session2 = await auth.getSession()
//     expect(session2).toBeNull()
//   })
//   it('passwordless, with redirect', async () => {
//     const auth = InitializeNextJWTAuth()

//     await expect(auth.signIn('passwordlessRedirect')).rejects.toThrowError('NEXT_REDIRECT')
//     expect(mockCookieStorage['ns-auth']).toBeUndefined()

//     await expect(auth.routeHandler(new Request('http://localhost:3000/api/auth/callback/passwordlessRedirect'))).rejects.toThrowError('NEXT_REDIRECT')
//     const token = jwt.verify(mockCookieStorage['ns-auth'], mockSecret)
//     expect(token.i).toEqual({ test: 456 })
//     expect(token.iss).toEqual("nextjwtauth")
//     expect(token.p).toEqual("passwordlessRedirect")
//     expect(token.t).toEqual({ name: "Mary Jane" })

//     const session = await auth.getSession()
//     expect(session).toEqual({ name: "Mary Jane" })

//     await auth.signOut()
//     expect(mockCookieStorage['ns-auth']).toBeUndefined()

//     const session2 = await auth.getSession()
//     expect(session2).toBeNull()

//   })
//   it('credentials, no redirect', async () => {
//     const auth = InitializeNextJWTAuth()

//     const result = await auth.signIn('hello', { email: 'Jane Doe', password: '123' })
//     expect(result).toEqual({ name: "Jane Doe" })
//     const token = jwt.verify(mockCookieStorage['ns-auth'], mockSecret)
//     expect(token.i).toEqual({ test: 789 })
//     expect(token.iss).toEqual("nextjwtauth")
//     expect(token.p).toEqual("hello")
//     expect(token.t).toEqual({ name: "Jane Doe" })

//     const session = await auth.getSession()
//     expect(session).toEqual({ name: "Jane Doe" })

//     await auth.signOut()
//     expect(mockCookieStorage['ns-auth']).toBeUndefined()

//     const session2 = await auth.getSession()
//     expect(session2).toBeNull()
//   })
//   it(('invalid parameters'), async () => {
//     const auth = InitializeNextJWTAuth()

//     // Note: TS Expect Error for testing
//     // @ts-expect-error Expected 1 arguments, but got 0.
//     await expect(auth.signIn()).rejects.toThrowError('Provider ID is required')
//     // @ts-expect-error No provider ''
//     await expect(auth.signIn('')).rejects.toThrowError('Provider ID is required')
//     // @ts-expect-error Requires credentials for this provider.
//     await expect(auth.signIn('hello')).rejects.toThrowError('Missing field: email')
//     // @ts-expect-error Wrong type for credentials
//     await expect(auth.signIn('hello', { password: '' })).rejects.toThrowError('Missing field: email')
//     // @ts-expect-error Should not have password field
//     await expect(auth.signIn('passwordlessRedirect', { password: '' })).rejects.toThrowError('Missing field: email')

//     const session2 = await auth.getSession()
//     expect(session2).toBeNull()
//   })
// })


// describe('auth using client functions', () => {

//   it('passwordless, no redirect', () => {
//     expect(true).toBe(true)
//   })

// })