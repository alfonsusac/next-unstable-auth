import { describe, expect, expectTypeOf, test } from "vitest"
import { validateCredentialValues } from "./modules/credentials"
import { AuthCore } from "."
import { DefaultUser, defaultUser, Provider } from "./modules/providers"
import { CookieOptions, CookieStore } from "./modules/cookie"


const playground = AuthCore({
  hostAuthPathURL: "https://www.acme.com/auth",
  providers: {
    p1: Provider({
      fields: () => ({
        email: { type: 'text' },
        password: { type: 'text' }
      }),
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
  jwt: {
    sign: function (payload: any, secret: string): string {
      throw new Error("Function not implemented.")
    },
    verify: function (token: string, secret: string): unknown {
      throw new Error("Function not implemented.")
    }
  },
  cookie: {
    get: function (name: string): string | null {
      throw new Error("Function not implemented.")
    },
    set: function (name: string, value: string, options?: CookieOptions): void {
      throw new Error("Function not implemented.")
    },
    delete: function (name: string): void {
      throw new Error("Function not implemented.")
    }
  },
  header: {
    get: function (name: string): string | null {
      throw new Error("Function not implemented.")
    },
    set: function (name: string, value: string): void {
      throw new Error("Function not implemented.")
    }
  },
  redirect: function (url: string): never {
    throw new Error("Function not implemented.")
  }
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

    const store = new CookieStore(cookie, "ns-auth", {})

    store.set("123")

    expect(emulatedCookieStorage["ns-auth"]).toEqual("123")
    expect(store.get()).toEqual("123")

    store.set("456")

    expect(emulatedCookieStorage["ns-auth"]).toEqual("456")
    expect(store.get()).toEqual("456")

    store.clear()

    expect(emulatedCookieStorage["ns-auth"]).toBeUndefined()
    expect(store.get()).toBeUndefined()

  })



  test('with toToken and toSession', async () => {
    const provider = Provider({
      fields: () => ({
        email: "",
        password: "",
      }),
      authenticate: async ($) => ({ data: { name: "John Doe" }, internal: { test: 123 } }),
      authorize: async ($) => ({ update: false }),
    })

    expectTypeOf(provider).toMatchTypeOf<Provider<{
      email: string;
      password: string;
    }, {
      name: string;
    }, {
      test: number;
    }>>()

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
      hostAuthPathURL: "",
      jwt: {
        sign: function (payload: any, secret: string): string {
          throw new Error("Function not implemented.")
        },
        verify: function (token: string, secret: string): unknown {
          throw new Error("Function not implemented.")
        }
      },
      cookie: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string, options?: CookieOptions): void {
          throw new Error("Function not implemented.")
        },
        delete: function (name: string): void {
          throw new Error("Function not implemented.")
        }
      },
      header: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string): void {
          throw new Error("Function not implemented.")
        }
      },
      redirect: function (url: string): never {
        throw new Error("Function not implemented.")
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
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "1" } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        })
      },
      hostAuthPathURL: "",
      jwt: {
        sign: function (payload: any, secret: string): string {
          throw new Error("Function not implemented.")
        },
        verify: function (token: string, secret: string): unknown {
          throw new Error("Function not implemented.")
        }
      },
      cookie: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string, options?: CookieOptions): void {
          throw new Error("Function not implemented.")
        },
        delete: function (name: string): void {
          throw new Error("Function not implemented.")
        }
      },
      header: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string): void {
          throw new Error("Function not implemented.")
        }
      },
      redirect: function (url: string): never {
        throw new Error("Function not implemented.")
      }
    })

    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<{
      name: string;
    } | DefaultUser>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{
      name: string;
    } | DefaultUser>()
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
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "1" } }, internal: { lorem: "456" } }),
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
            id: string;
          };
        }>()
        return {
          yes: ""
        }
      },
      hostAuthPathURL: "",
      jwt: {
        sign: function (payload: any, secret: string): string {
          throw new Error("Function not implemented.")
        },
        verify: function (token: string, secret: string): unknown {
          throw new Error("Function not implemented.")
        }
      },
      cookie: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string, options?: CookieOptions): void {
          throw new Error("Function not implemented.")
        },
        delete: function (name: string): void {
          throw new Error("Function not implemented.")
        }
      },
      header: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string): void {
          throw new Error("Function not implemented.")
        }
      },
      redirect: function (url: string): never {
        throw new Error("Function not implemented.")
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
          authenticate: async () => ({ data: { age: 4, [defaultUser]: { id: "1" } }, internal: { lorem: "456" } }),
          authorize: async () => ({ update: false }),
        })
      },
      toSession: (p) => {
        expectTypeOf(p).toEqualTypeOf<DefaultUser | {
          name: string;
        }>()
        return {
          hello: ""
        }
      },
      hostAuthPathURL: "",
      jwt: {
        sign: function (payload: any, secret: string): string {
          throw new Error("Function not implemented.")
        },
        verify: function (token: string, secret: string): unknown {
          throw new Error("Function not implemented.")
        }
      },
      cookie: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string, options?: CookieOptions): void {
          throw new Error("Function not implemented.")
        },
        delete: function (name: string): void {
          throw new Error("Function not implemented.")
        }
      },
      header: {
        get: function (name: string): string | null {
          throw new Error("Function not implemented.")
        },
        set: function (name: string, value: string): void {
          throw new Error("Function not implemented.")
        }
      },
      redirect: function (url: string): never {
        throw new Error("Function not implemented.")
      }
    })
    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<DefaultUser | {
      name: string;
    }>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<{ hello: string; }>()
  })
})
