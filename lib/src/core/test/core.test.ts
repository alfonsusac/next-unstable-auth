import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { AuthCore } from ".."
import { defaultUser, Provider } from "../modules/providers"
import { mockCookie, mockHeader } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { testSignInMethod } from "./helper"
import { mockRedirect } from "./module.config.test"

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Mocks

export const mockProviderOAuthURL = 'http://www.oauthprovider.com/auth'
export const testCallbackURI = vi.fn()

export const testCredentials = vi.fn()
export const testInternal = vi.fn()

const mockProviders = {

  noDefaultUser: {
    config: Provider({
      authenticate: async ($) => {
        testCredentials($.credentials)
        return ({ data: { name: "John Doe" }, internal: { test: 123 } })
      },
      authorize: async (data) => {
        testInternal(data, "noDefaultUser")
        return ({ update: false })
      },
    }),
    data: { name: "John Doe" },
    internal: { test: 123 },
  },

  generalCase: {
    config: Provider({
      authenticate: async ($) => {
        testCredentials($.credentials)
        return ({
          data: { age: 4, [defaultUser]: { id: "asd", name: "1", email: "2", image: "3" } },
          internal: { lorem: "456" }
        })
      },
      authorize: async (data) => {
        testInternal(data, "general")
        return ({ update: false })
      },
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
      authenticate: async ($) => {
        testCredentials($.credentials)
        return ({ data: { age: 4, [defaultUser]: { id: "1", email: $.credentials.email } }, internal: { lorem: "789" } })
      },
      authorize: async (data) => {
        testInternal(data, "withFields")
        return ({ update: false })
      },
    }),
    data: (name: string) => ({ id: "1", email: name }),
    internal: { lorem: "789" },
  }

}

export const mockAuthURL = "https://www.acme.com"
export const mockOriginURL = "https://feature-branch.acme.com"

export const sharedSettings = {
  authPath: "/ayyopath" as `/${ string }`,
  authURL: mockAuthURL,
  cookie: mockCookie,
  expiry: 60 * 60 * 24 * 7,
  header: mockHeader,
  jwt: mockJwt,
  redirect: mockRedirect,
  secret: '123',
  request: {
    originURL: mockOriginURL,
  },
  providers: {
    p1: mockProviders.generalCase.config,
    p2: mockProviders.generalCaseWithFields.config,
  },
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Tests

describe('Module: Core', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider + Callback scenarios', () => {

    it('should throw error if invalid provider and no toToken', async () => {
      const auth = AuthCore({
        ...sharedSettings,
        providers: {
          p1: mockProviders.noDefaultUser.config
        },
      })
      await expect(auth.signIn("p1", undefined)).rejects.toThrow("Default User is missing in Provider Authenticate Data Return")
    })

    it('should not throw error if invalid provider but with toToken', async () => {
      const auth = AuthCore({
        ...sharedSettings,
        providers: {
          p1: mockProviders.noDefaultUser.config
        },
        toToken: (p) => p
      })
      await expect(auth.signIn("p1", undefined)).resolves.toEqual(mockProviders.noDefaultUser.data)
    })

    function withCustomData<T>(p: T) {
      return {
        ...p,
        hello: "world"
      }
    }

    function withAnotherCustomData<T>(p: T) {
      return {
        ...p,
        foo: "bar"
      }
    }

    testSignInMethod(
      'default toToken and toSession',
      AuthCore({
        ...sharedSettings,
      }),
      {
        p1: {
          token: mockProviders.generalCase.data,
          session: mockProviders.generalCase.data,
          internal: mockProviders.generalCase.internal,
          param: undefined,
        },
        p2: {
          token: mockProviders.generalCaseWithFields.data("EML"),
          session: mockProviders.generalCaseWithFields.data("EML"),
          internal: mockProviders.generalCaseWithFields.internal,
          param: { email: "EML", password: "PWD" },
        }
      }
    )

    testSignInMethod(
      'custom toToken',
      AuthCore({
        ...sharedSettings,
        toToken: (p) => withCustomData(p[defaultUser])
      }),
      {
        p1: {
          token: withCustomData(mockProviders.generalCase.data),
          session: withCustomData(mockProviders.generalCase.data),
          internal: mockProviders.generalCase.internal,
          param: undefined,
        },
        p2: {
          token: withCustomData(mockProviders.generalCaseWithFields.data("EML")),
          session: withCustomData(mockProviders.generalCaseWithFields.data("EML")),
          internal: mockProviders.generalCaseWithFields.internal,
          param: { email: "EML", password: "PWD" },
        }
      }
    )


    testSignInMethod(
      'custom toToken and toSession',
      AuthCore({
        ...sharedSettings,
        toToken: (p) => withCustomData(p[defaultUser]),
        toSession: (p) => withAnotherCustomData(p)
      }),
      {
        p1: {
          token: withCustomData(mockProviders.generalCase.data),
          session: withAnotherCustomData(withCustomData(mockProviders.generalCase.data)),
          internal: mockProviders.generalCase.internal,
          param: undefined,
        },
        p2: {
          token: withCustomData(mockProviders.generalCaseWithFields.data("EML")),
          session: withAnotherCustomData(withCustomData(mockProviders.generalCaseWithFields.data("EML"))),
          internal: mockProviders.generalCaseWithFields.internal,
          param: { email: "EML", password: "PWD" },
        }
      }
    )

    testSignInMethod(
      'custom toSession',
      AuthCore({
        ...sharedSettings,
        toSession: (p) => withAnotherCustomData(p)
      }),
      {
        p1: {
          token: mockProviders.generalCase.data,
          session: withAnotherCustomData(mockProviders.generalCase.data),
          internal: mockProviders.generalCase.internal,
          param: undefined,
        },
        p2: {
          token: mockProviders.generalCaseWithFields.data("EML"),
          session: withAnotherCustomData(mockProviders.generalCaseWithFields.data("EML")),
          internal: mockProviders.generalCaseWithFields.internal,
          param: { email: "EML", password: "PWD" },
        }
      },
    )
  })

  describe('URLs', () => {
    it('should return correct callback URL', async () => {
      const auth = AuthCore({
        ...sharedSettings,
        authURL: mockAuthURL,
        authPath: "/auth",
        providers: {
          p1: Provider({
            authenticate: async ($) => {
              mockRedirect($.callbackURI)
              return ({ data: { id: "1" }, internal: {} })
            },
            authorize: async () => ({ update: false }),
          }),
        }
      })
      try {
        await auth.signIn("p1", undefined)
      } catch (error) { }
      expect(mockRedirect).toBeCalledWith(`${ mockAuthURL }/auth/callback/p1`)
    })
  })
})



