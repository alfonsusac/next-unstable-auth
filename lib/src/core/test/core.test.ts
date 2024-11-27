import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthCore } from ".."
import { defaultUser, Provider } from "../modules/providers"
import { mockCookie, mockHeader } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { testSignInMethod } from "./helper"
import { mockRedirect } from "./module.config.test"
import type { AbsolutePath, URLString } from "../modules/url"

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Mocks

export const mockProviderOAuthURL = 'http://www.oauthprovider.com/auth'
export const testCallbackURI = vi.fn()

export const testCredentials = vi.fn()
export const testInternal = vi.fn()



export const mockAuthURL = "https://www.acme.com/ayyopath/auth" as URLString
export const mockOriginURL = "https://feature-branch.acme.com"

export const sharedSettings = {
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
  validateRedirect: (url: string) => url,
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Tests

describe('Module: Core', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Provider + Callback scenarios', () => {

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

    it('should throw error if invalid provider and no toToken', async () => {
      const auth = AuthCore({
        ...sharedSettings,
        providers: { p1: mockProviders.noDefaultUser.config },
      })
      await expect(auth.signIn("p1", undefined)).rejects.toThrow("Default User is missing in Provider Authenticate Data Return")
    })
    it('should not throw error if invalid provider but with toToken', async () => {
      const auth = AuthCore({
        ...sharedSettings,
        providers: { p1: mockProviders.noDefaultUser.config },
        toToken: (p) => p
      })
      await expect(auth.signIn("p1", undefined)).resolves.toEqual(mockProviders.noDefaultUser.data)
    })

    const withCustomData = <T>(p: T) => ({ ...p, hello: "world" })
    const withAnotherCustomData = <T>(p: T) => ({ ...p, foo: "bar" })

    const sharedSettingsForCallbackTests = {
      ...sharedSettings,
      providers: {
        p1: mockProviders.generalCase.config,
        p2: mockProviders.generalCaseWithFields.config,
      },
    }

    testSignInMethod('default toToken and toSession',
      AuthCore(sharedSettingsForCallbackTests),
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
    testSignInMethod('custom toToken',
      AuthCore({
        ...sharedSettingsForCallbackTests,
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
    testSignInMethod('custom toToken and toSession',
      AuthCore({
        ...sharedSettingsForCallbackTests,
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
    testSignInMethod('custom toSession',
      AuthCore({
        ...sharedSettingsForCallbackTests,
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

  describe('Callback URLs', () => {
    it('should return correct callback URL', async () => {
      const auth = AuthCore({
        ...sharedSettings,
        providers: {
          p1: Provider({
            authenticate: async ($) => {
              testCallbackURI($.callbackURI)
              return ({ data: { [defaultUser]: { id: "1" } }, internal: {} })
            },
            authorize: async () => ({ update: false }),
          })
        }
      })
      try { await auth.signIn("p1", undefined) } catch (error) { }
      expect(testCallbackURI).toBeCalledWith(`${ mockAuthURL }/callback/p1`)
    })
  })

  describe('Redirect URL', () => {

    const signInAuth = async (
      originURL: string,
      validateRedirect: ((url: string) => string) | undefined,
      redirectTo: URLString | AbsolutePath | undefined,
    ) => await
        AuthCore({
          ...sharedSettings,
          providers: { p1: Provider({ authenticate: async ($) => ({ data: { [defaultUser]: { id: "1" } }, internal: {} }) }), },
          request: { originURL },
          validateRedirect,
        }).signIn("p1", undefined, { redirectTo })

    describe('default validateRedirect', () => {
      describe('request have same origin', () => {
        const sameOriginCurrentURL = "https://www.acme.com/dashboard"
        describe('no redirect', () => {
          it('should call cookie.set with /', async () => {
            await signInAuth(sameOriginCurrentURL, undefined, undefined)
            expect(mockCookie.set).toBeCalledWith('nu-redirect', '/dashboard', expect.anything())
          })
          it('should not call redirect', async () => {
            await signInAuth(sameOriginCurrentURL, undefined, undefined)
            expect(mockRedirect).not.toBeCalled()
          })
        })
        describe('redirect with path', () => {
          it('should call cookie.set with path', async () => {
            await signInAuth(sameOriginCurrentURL, undefined, '/a')
            expect(mockCookie.set).toBeCalledWith('nu-redirect', '/a', expect.anything())
          })
          it('should call redirect', async () => {
            await signInAuth(sameOriginCurrentURL, undefined, '/a')
            expect(mockRedirect).toBeCalledWith('/a')
          })
        })
        describe('redirect with URL', () => {
          describe('same origin', () => {
            it('should call cookie.set with URL', async () => {
              await signInAuth(sameOriginCurrentURL, undefined, 'https://www.acme.com/aaaa')
              expect(mockCookie.set).toBeCalledWith('nu-redirect', 'https://www.acme.com/aaaa', expect.anything())
            })
            it('should call redirect', async () => {
              await signInAuth(sameOriginCurrentURL, undefined, 'https://www.acme.com/aaaa')
              expect(mockRedirect).toBeCalledWith('https://www.acme.com/aaaa')
            })
          })
          describe('different origin', () => {
            it('should throw error', async () => {
              await expect(signInAuth(sameOriginCurrentURL, undefined, 'https://www.abcd.com/aaaa')).rejects.toThrow("Redirect origin URL (https://www.abcd.com/aaaa)")
            })
          })
        })
      })
      describe('request have different origin', () => {
        const nonBaseOriginCurrentURL = "https://feature.acme.com/dashboard"
        describe('no redirect', () => {
          it('should throw error', async () => {
            await expect(signInAuth(nonBaseOriginCurrentURL, undefined, undefined)).rejects.toThrow()
          })
        })
        describe('redirect with path', () => {
          it('should throw error', async () => {
            await expect(signInAuth(nonBaseOriginCurrentURL, undefined, '/a')).rejects.toThrow()
          })
        })
        describe('redirect with URL', () => {
          describe('same origin as request origin', () => {
            it('should throw error', async () => {
              await expect(signInAuth(nonBaseOriginCurrentURL, undefined, 'https://feature.acme.com/aaaa')).rejects.toThrow("Redirect origin URL (https://feature.acme.com/aaaa)")
            })
          })
          describe('different origin than request origin', () => {
            it('should throw error', async () => {
              await expect(signInAuth(nonBaseOriginCurrentURL, undefined, 'https://asdf.acme.com/aaaaayay')).rejects.toThrow("Redirect origin URL (https://asdf.acme.com/aaaaayay)")
            })
          })
          describe('same origin as auth origin', () => {
            it('should call cookie.set with redirect url', async () => {
              await signInAuth(nonBaseOriginCurrentURL, undefined, 'https://www.acme.com/aaaaayay')
              expect(mockCookie.set).toBeCalledWith('nu-redirect', 'https://www.acme.com/aaaaayay', expect.anything())
            })
            it('should call redirect to redirect url', async () => {
              await signInAuth(nonBaseOriginCurrentURL, undefined, 'https://www.acme.com/aaaaayay')
              expect(mockRedirect).toBeCalledWith('https://www.acme.com/aaaaayay')
            })
          })
        })
      })
    })

    describe('redirect initiated by provider', () => {
      it('should throw no error', async () => {
        await expect(
          AuthCore({
            ...sharedSettings, providers: {
              p1: Provider({
                authenticate: async ($) => {
                  $.requestContext.redirect('http://www.oauthprovider.com/auth')
                  return ({ data: { [defaultUser]: { id: "1" } }, internal: {} })
                }
              })
            }
          }).signIn("p1", undefined)
        ).resolves.not.toThrow()
        expect(mockRedirect).toBeCalledWith('http://www.oauthprovider.com/auth')
      })
    })
  })

  describe('Sign Out', () => {
    
  })

})



