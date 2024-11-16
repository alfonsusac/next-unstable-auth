import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { AuthCore } from ".."
import { DefaultUser, defaultUser, Provider } from "../modules/providers"
import { CookieOptions, CookieStore } from "../modules/cookie"
import { mockCookie, mockHeader } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { Redirect } from "../modules/redirect"
import { nowInSeconds } from "../modules/jwt"
import { testSignInMethod } from "./helper"

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Mocks



export const mockRedirect = vi.fn<Redirect>()

const mockProviders = {
  noDefaultUser: {
    config: Provider({
      authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
      authorize: async () => ({ update: false }),
    }),
    data: { name: "John Doe" },
    internal: { test: 123 },
  },
  generalCase: {
    config: Provider({
      authenticate: async ($) => {
        return ({
          data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } },
          internal: { lorem: "456" }
        })
      },
      authorize: async () => ({ update: false }),
    }),
    data: { id: "asd", name: "1", email: "2", image: "3" },
    internal: { lorem: "456" },
  },
  generalCaseWithRedirect: {
    config: Provider({
      authenticate: async ($) => {
        $.requestContext?.cookie.set("a", "b")
        $.requestContext?.redirect($.callbackURI)
        return ({
          data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } },
          internal: { lorem: "456" }
        })
      },
      authorize: async () => ({ update: false }),
    }),
    data: { id: "asd", name: "1", email: "2", image: "3" },
    internal: { lorem: "456" },
  },
  generalCaseWithFields: {
    config: Provider({
      fields: (values: any) => ({
        email: values.email as string,
        password: values.password as string,
      }),
      authenticate: async ($) => ({ data: { age: 4, [defaultUser]: { id: "1", email: $.credentials.email } }, internal: { lorem: "789" } }),
      authorize: async () => ({ update: false }),
    }),
    data: (name: string) => ({ id: "1", email: name }),
    internal: { lorem: "789" },
  }
}

export const sharedSettings = {
  authPath: "/ayyopath" as `/${ string }`,
  cookie: mockCookie,
  expiry: 60 * 60 * 24 * 7,
  header: mockHeader,
  jwt: mockJwt,
  redirect: mockRedirect,
  secret: '123',
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Tests



describe('Core Auth', () => {


  describe('signIn', () => {

    testSignInMethod(
      'default toToken and toSession',
      AuthCore({
        ...sharedSettings,
        providers: {
          p1: mockProviders.generalCase.config,
          p2: mockProviders.generalCaseWithFields.config,
          p3: mockProviders.generalCaseWithRedirect.config,
        },
      }),
      {
        token: {
          p1: mockProviders.generalCase.data,
          p2: mockProviders.generalCaseWithFields.data("EML"),
          p3: mockProviders.generalCaseWithRedirect.data,
        },
        session: {
          p1: mockProviders.generalCase.data,
          p2: mockProviders.generalCaseWithFields.data("EML"),
          p3: mockProviders.generalCaseWithRedirect.data,
        },
        internal: {
          p1: mockProviders.generalCase.internal,
          p2: mockProviders.generalCaseWithFields.internal,
          p3: mockProviders.generalCaseWithRedirect.internal,
        },
        param: {
          p1: undefined,
          p2: { email: "EML", password: "PWD" },
          p3: undefined,
        }
      }
    )


    function withCustomData<T>(p: T) {
      return {
        ...p,
        hello: "world"
      }
    }

    testSignInMethod(
      'custom toToken',
      AuthCore({
        ...sharedSettings,
        providers: {
          p1: mockProviders.generalCase.config,
          p2: mockProviders.generalCaseWithFields.config,
          p3: mockProviders.generalCaseWithRedirect.config,
        },
        toToken: (p) => {
          return withCustomData(p[defaultUser])
        }
      }),
      {
        token: {
          p1: withCustomData(mockProviders.generalCase.data),
          p2: withCustomData(mockProviders.generalCaseWithFields.data("EML")),
          p3: withCustomData(mockProviders.generalCaseWithRedirect.data),
        },
        session: {
          p1: withCustomData(mockProviders.generalCase.data),
          p2: withCustomData(mockProviders.generalCaseWithFields.data("EML")),
          p3: withCustomData(mockProviders.generalCaseWithRedirect.data),
        },
        internal: {
          p1: mockProviders.generalCase.internal,
          p2: mockProviders.generalCaseWithFields.internal,
          p3: mockProviders.generalCaseWithRedirect.internal,
        },
        param: {
          p1: undefined,
          p2: { email: "EML", password: "PWD" },
          p3: undefined,
        }
      }
    )

    function withAnotherCustomData<T>(p: T) {
      return {
        ...p,
        foo: "bar"
      }
    }

    testSignInMethod(
      'custom toToken and toSession',
      AuthCore({
        ...sharedSettings,
        providers: {
          p1: mockProviders.generalCase.config,
          p2: mockProviders.generalCaseWithFields.config,
          p3: mockProviders.generalCaseWithRedirect.config,
        },
        toToken: (p) => {
          return withCustomData(p[defaultUser])
        },
        toSession: (p) => {
          return withAnotherCustomData(p)
        }
      }),
      {
        token: {
          p1: withCustomData(mockProviders.generalCase.data),
          p2: withCustomData(mockProviders.generalCaseWithFields.data("EML")),
          p3: withCustomData(mockProviders.generalCaseWithRedirect.data),
        },
        session: {
          p1: withAnotherCustomData(withCustomData(mockProviders.generalCase.data)),
          p2: withAnotherCustomData(withCustomData(mockProviders.generalCaseWithFields.data("EML"))),
          p3: withAnotherCustomData(withCustomData(mockProviders.generalCaseWithRedirect.data)),
        },
        internal: {
          p1: mockProviders.generalCase.internal,
          p2: mockProviders.generalCaseWithFields.internal,
          p3: mockProviders.generalCaseWithRedirect.internal,
        },
        param: {
          p1: undefined,
          p2: { email: "EML", password: "PWD" },
          p3: undefined,
        }
      }
    )

    testSignInMethod(
      'custom toSession',
      AuthCore({
        ...sharedSettings,
        providers: {
          p1: mockProviders.generalCase.config,
          p2: mockProviders.generalCaseWithFields.config,
          p3: mockProviders.generalCaseWithRedirect.config,
        },
        toSession: (p) => {
          return withAnotherCustomData(p)
        }
      }),
      {
        token: {
          p1: (mockProviders.generalCase.data),
          p2: (mockProviders.generalCaseWithFields.data("EML")),
          p3: (mockProviders.generalCaseWithRedirect.data),
        },
        session: {
          p1: withAnotherCustomData((mockProviders.generalCase.data)),
          p2: withAnotherCustomData((mockProviders.generalCaseWithFields.data("EML"))),
          p3: withAnotherCustomData((mockProviders.generalCaseWithRedirect.data)),
        },
        internal: {
          p1: mockProviders.generalCase.internal,
          p2: mockProviders.generalCaseWithFields.internal,
          p3: mockProviders.generalCaseWithRedirect.internal,
        },
        param: {
          p1: undefined,
          p2: { email: "EML", password: "PWD" },
          p3: undefined,
        }
      }
    )

  })

})













// const playground = AuthCore({
//   authPath: "/auth",
//   providers: {
//     p1: Provider({
//       fields: () => ({
//         email: { type: 'text' },
//         password: { type: 'text' }
//       }),
//       authenticate:
//         async () => (
//           {
//             data: {
//               name: "John Doe",
//               [defaultUser]: { id: "5", name: "1", email: "2", image: "3" } as DefaultUser
//             }, internal: { test: 123 }
//           }
//         ),
//       authorize:
//         async () => (
//           { update: false }
//         ),
//     }),
//     p2: Provider({
//       authenticate:
//         async () => (
//           {
//             data: {
//               age: 4,
//               // [defaultUser]: { id: "4", name: "1", email: "2", image: "3" } as DefaultUser
//             }, internal: { test: 123 }
//           }
//         ),
//       authorize:
//         async (data: { test: number} ) => (
//           { update: false }
//         ),
//     })
//   },
//   secret: "c",
//   session: {
//     cookieName: "a",
//     issuer: "b",
//   },
//   jwt: {
//     sign: function (payload: any, secret: string): string {
//       throw new Error("Function not implemented.")
//     },
//     verify: function (token: string, secret: string): unknown {
//       throw new Error("Function not implemented.")
//     }
//   },
//   cookie: {
//     get: function (name: string): string | null {
//       throw new Error("Function not implemented.")
//     },
//     set: function (name: string, value: string, options?: CookieOptions): void {
//       throw new Error("Function not implemented.")
//     },
//     delete: function (name: string): void {
//       throw new Error("Function not implemented.")
//     }
//   },
//   header: {
//     get: function (name: string): string | null {
//       throw new Error("Function not implemented.")
//     },
//     set: function (name: string, value: string): void {
//       throw new Error("Function not implemented.")
//     }
//   },
//   redirect: function (url: string): never {
//     throw new Error("Function not implemented.")
//   }
// })

// const token = playground.$Infer.Session

// describe('core config', () => {

//   // it('credential values', async () => {
//   //   const schema = {
//   //     name: { type: 'text' },
//   //     age: { type: 'number' }
//   //   } as const

//   //   // @ts-expect-error
//   //   expect(() => validateCredentialValues(schema)).toThrowError("Expected object for values")
//   //   expect(() => validateCredentialValues(schema, 4)).toThrowError("Expected object for values")
//   //   expect(() => validateCredentialValues(schema, { name: 2 })).toThrowError("Expected string for field name")
//   //   expect(() => validateCredentialValues(schema, { name: "A" })).toThrowError("Missing field age")
//   //   expect(() => validateCredentialValues(schema, { name: "A", age: "B" })).toThrowError("Expected number for field age")
//   //   expect(() => validateCredentialValues(schema, { name: "A", age: 2 })).not.toThrow()
//   //   expect(() => validateCredentialValues(schema, { name: "A", age: 2, phone: 48 })).not.toThrow()

//   //   expectTypeOf(() => validateCredentialValues(schema, { name: "A", age: 2 })).returns.toMatchTypeOf<{ name: string, age: number }>()
//   // })


//   it('with toToken and toSession', async () => {
//     const provider = Provider({
//       fields: () => ({
//         email: "",
//         password: "",
//       }),
//       authenticate: async ($) => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
//       authorize: async ($) => ({ update: false }),
//     })

//     expectTypeOf(provider).toMatchTypeOf<Provider<{
//       email: string;
//       password: string;
//     }, {
//       name: string;
//     }, {
//       test: number;
//     }>>()

//     const auth = AuthCore({
//       expiry: 60 * 60 * 24 * 7,
//       secret: "123",
//       providers: {
//         p1: provider,
//         p2: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "5", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         })
//       },
//       authPath: "/auth",
//       jwt: {
//         sign: function (payload: any, secret: string): string {
//           throw new Error("Function not implemented.")
//         },
//         verify: function (token: string, secret: string): unknown {
//           throw new Error("Function not implemented.")
//         }
//       },
//       cookie: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string, options?: CookieOptions): void {
//           throw new Error("Function not implemented.")
//         },
//         delete: function (name: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       header: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       redirect: function (url: string): never {
//         throw new Error("Function not implemented.")
//       },
//       toToken: (p) => {

//         expectTypeOf(p).toEqualTypeOf<{
//           name: string;
//         } | {
//           age: number;
//           [defaultUser]: {
//             id: string;
//             name: string;
//             email: string;
//             image: string;
//           };
//         }>()

//         return {
//           yes: ""
//         }
//       },
//       toSession: (p) => {

//         expectTypeOf(p).toEqualTypeOf<{ yes: string; }>()
//         return {
//           hello: ""
//         }
//       }
//     })

//     expectTypeOf(auth.$Infer.Token).toEqualTypeOf<{ yes: string; }>()
//     expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ hello: string; }>()
//   })



//   it('without toToken and toSession', async () => {
//     const auth = AuthCore({
//       expiry: 60 * 60 * 24 * 7,
//       session: {
//         cookieName: "a",
//         issuer: "b",
//       },
//       secret: "123",
//       providers: {
//         p1: Provider({
//           authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
//           authorize: async () => ({ update: false }),
//         }),
//         p2: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         }),
//         p3: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "1" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         })
//       },
//       authPath: "/auth",
//       jwt: {
//         sign: function (payload: any, secret: string): string {
//           throw new Error("Function not implemented.")
//         },
//         verify: function (token: string, secret: string): unknown {
//           throw new Error("Function not implemented.")
//         }
//       },
//       cookie: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string, options?: CookieOptions): void {
//           throw new Error("Function not implemented.")
//         },
//         delete: function (name: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       header: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       redirect: function (url: string): never {
//         throw new Error("Function not implemented.")
//       }
//     })

//     expectTypeOf(auth.$Infer.Token).toEqualTypeOf<{
//       name: string;
//     } | DefaultUser>()
//     expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{
//       name: string;
//     } | DefaultUser>()
//   })



//   it('with toToken but without toSession', async () => {
//     const auth = AuthCore({
//       expiry: 60 * 60 * 24 * 7,
//       session: {
//         cookieName: "a",
//         issuer: "b",
//       },
//       secret: "123",
//       providers: {
//         p1: Provider({
//           authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
//           authorize: async () => ({ update: false }),
//         }),
//         p2: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         }),
//         p3: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "1" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         })
//       },
//       toToken: (p) => {
//         expectTypeOf(p).toEqualTypeOf<{
//           name: string;
//         } | {
//           age: number;
//           [defaultUser]: {
//             id: string;
//             name: string;
//             email: string;
//             image: string;
//           };
//         } | {
//           age: number;
//           [defaultUser]: {
//             id: string;
//           };
//         }>()
//         return {
//           yes: ""
//         }
//       },
//       authPath: "/auth",
//       jwt: {
//         sign: function (payload: any, secret: string): string {
//           throw new Error("Function not implemented.")
//         },
//         verify: function (token: string, secret: string): unknown {
//           throw new Error("Function not implemented.")
//         }
//       },
//       cookie: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string, options?: CookieOptions): void {
//           throw new Error("Function not implemented.")
//         },
//         delete: function (name: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       header: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       redirect: function (url: string): never {
//         throw new Error("Function not implemented.")
//       }
//     })
//     expectTypeOf(auth.$Infer.Token).toEqualTypeOf<{ yes: string; }>()
//     expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ yes: string; }>()
//   })



//   it('without toToken but with toSession', async () => {
//     const auth = AuthCore({
//       expiry: 60 * 60 * 24 * 7,
//       session: {
//         cookieName: "a",
//         issuer: "b",
//       },
//       secret: "123",
//       providers: {
//         p1: Provider({
//           authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
//           authorize: async () => ({ update: false }),
//         }),
//         p2: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         }),
//         p3: Provider({
//           authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "1" } }, internal: { lorem: "456" } }),
//           authorize: async () => ({ update: false }),
//         })
//       },
//       toSession: (p) => {
//         expectTypeOf(p).toEqualTypeOf<DefaultUser | {
//           name: string;
//         }>()
//         return {
//           hello: ""
//         }
//       },
//       authPath: "/auth",
//       jwt: {
//         sign: function (payload: any, secret: string): string {
//           throw new Error("Function not implemented.")
//         },
//         verify: function (token: string, secret: string): unknown {
//           throw new Error("Function not implemented.")
//         }
//       },
//       cookie: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string, options?: CookieOptions): void {
//           throw new Error("Function not implemented.")
//         },
//         delete: function (name: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       header: {
//         get: function (name: string): string | null {
//           throw new Error("Function not implemented.")
//         },
//         set: function (name: string, value: string): void {
//           throw new Error("Function not implemented.")
//         }
//       },
//       redirect: function (url: string): never {
//         throw new Error("Function not implemented.")
//       }
//     })
//     expectTypeOf(auth.$Infer.Token).toEqualTypeOf<DefaultUser | {
//       name: string;
//     }>()
//     expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ hello: string; }>()
//   })
// })
