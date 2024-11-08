import { describe, expect, expectTypeOf, test } from "vitest"
import { validateCredentialValues } from "./modules/credentials"
import { AuthCore } from "."
import { DefaultUser, defaultUser, Provider } from "./modules/providers"
import { CookieStore } from "./modules/cookie"


const playground = AuthCore({
  providers: {
    p1: Provider({
      authenticate:
        async () => (
          {
            data: {
              name: "John Doe",
              [defaultUser]: { id: "5", name: "1", email: "2", image: "3" } as DefaultUser
            }, internal: { test: 123 }
          }
        ),
      authorize:
        async (data: { test: number }) => (
          { update: false }
        ),
    }),
    p2: Provider({
      authenticate:
        async () => (
          {
            data: {
              age: 4,
              // [defaultUser]: { id: "4", name: "1", email: "2", image: "3" } as DefaultUser
            }, internal: { test: 123 }
          }
        ),
      authorize:
        async (data: { test: number }) => (
          { update: false }
        ),
    })
  },
  secret: "c",
  session: {
    cookieName: "a",
    issuer: "b",
  },
  // toToken: async (data) => {
  //   return {
  //     yes: ""
  //   }
  // },
  // validate: (data) => {
  //   return {
  //     yes: "John Doe"
  //   }
  // },
  // toSession: async (data) => {
  //   return {
  //     test: 'wordl'
  //   }
  // }
})

const token = playground.$Infer.Session

describe('core config', () => {

  test('credential values', async () => {
    const schema = {
      name: { type: 'text' },
      age: { type: 'number' }
    } as const

    // @ts-expect-error
    expect(() => validateCredentialValues(schema)).toThrowError("Expected object for values")
    expect(() => validateCredentialValues(schema, 4)).toThrowError("Expected object for values")
    expect(() => validateCredentialValues(schema, { name: 2 })).toThrowError("Expected string for field name")
    expect(() => validateCredentialValues(schema, { name: "A" })).toThrowError("Missing field age")
    expect(() => validateCredentialValues(schema, { name: "A", age: "B" })).toThrowError("Expected number for field age")
    expect(() => validateCredentialValues(schema, { name: "A", age: 2 })).not.toThrow()
    expect(() => validateCredentialValues(schema, { name: "A", age: 2, phone: 48 })).not.toThrow()

    expectTypeOf(() => validateCredentialValues(schema, { name: "A", age: 2 })).returns.toMatchTypeOf<{ name: string, age: number }>()
  })

  test('cookie store', async () => {

    const emulatedCookieStorage = {} as Record<string, string>

    const cookie = {
      get: (key: string) => emulatedCookieStorage[key],
      set: (key: string, value: string) => emulatedCookieStorage[key] = value,
      delete: (key: string) => delete emulatedCookieStorage[key]
    }

    const store = new CookieStore("ns-auth", {})

    store.set(cookie, "123")

    expect(emulatedCookieStorage["ns-auth"]).toEqual("123")
    expect(store.get(cookie)).toEqual("123")

    store.set(cookie, "456")

    expect(emulatedCookieStorage["ns-auth"]).toEqual("456")
    expect(store.get(cookie)).toEqual("456")

    store.clear(cookie)

    expect(emulatedCookieStorage["ns-auth"]).toBeUndefined()
    expect(store.get(cookie)).toBeUndefined()

  })



  test('with toToken and toSession', async () => {
    const provider = Provider({
      authenticate: async (param: { email: string, password: string }) => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
      authorize: async (data: { test: number }) => ({ update: false }),
    })

    expectTypeOf(provider).toMatchTypeOf<{
      authenticate: (param: { email: string, password: string }) => Promise<{ data: { name: string; }; internal: { test: number; }; }>,
      authorize: (data: { test: number }) => Promise<{ update: boolean; }>
    }>()

    const auth = AuthCore({
      session: {
        cookieName: "a",
        issuer: "b",
      },
      secret: "123",
      providers: {
        p1: provider,
        p2: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "5", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        })
      },
      toToken: (p) => {

        expectTypeOf(p).toEqualTypeOf<{
          name: string;
        } | {
          age: number;
          [defaultUser]: {
            id: string;
            name: string;
            email: string;
            image: string;
          };
        }>()

        return {
          yes: ""
        }
      },
      toSession: (p) => {

        expectTypeOf(p).toEqualTypeOf<{ yes: string; }>()
        return {
          hello: ""
        }
      }
    })

    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<{ yes: string; }>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ hello: string; }>()
  })



  test('without toToken and toSession', async () => {
    const auth = AuthCore({
      session: {
        cookieName: "a",
        issuer: "b",
      },
      secret: "123",
      providers: {
        p1: Provider({
          authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
          authorize: async () => ({ update: false }),
        }),
        p2: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        }),
        p3: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: 1 } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        })
      }
    })

    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<DefaultUser>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<DefaultUser>()
  })



  test('with toToken but without toSession', async () => {
    const auth = AuthCore({
      session: {
        cookieName: "a",
        issuer: "b",
      },
      secret: "123",
      providers: {
        p1: Provider({
          authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
          authorize: async () => ({ update: false }),
        }),
        p2: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        }),
        p3: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: 1 } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        })
      },
      toToken: (p) => {
        expectTypeOf(p).toEqualTypeOf<{
          name: string;
        } | {
          age: number;
          [defaultUser]: {
            id: string;
            name: string;
            email: string;
            image: string;
          };
        } | {
          age: number;
          [defaultUser]: {
            id: number;
          };
        }>()
        return {
          yes: ""
        }
      }
    })
    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<{ yes: string; }>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ yes: string; }>()
  })



  test('without toToken but with toSession', async () => {
    const auth = AuthCore({
      session: {
        cookieName: "a",
        issuer: "b",
      },
      secret: "123",
      providers: {
        p1: Provider({
          authenticate: async () => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
          authorize: async () => ({ update: false }),
        }),
        p2: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        }),
        p3: Provider({
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: 1 } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        })
      },
      toSession: (p) => {
        expectTypeOf(p).toEqualTypeOf<DefaultUser>()
        return {
          hello: ""
        }
      }
    })
    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<DefaultUser>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ hello: string; }>()
  })
})
