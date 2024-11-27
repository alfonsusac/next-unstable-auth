import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthCore } from ".."
import { defaultUser, Provider } from "../modules/providers"
import { mockCookie, mockHeader } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { testSignInMethod } from "./helper"
import { mockRedirect } from "./module.config.test"
import type { AbsolutePath, URLString } from "../modules/url"
import { nowInSeconds } from "../modules/jwt"

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Mocks

export const mockProviderOAuthURL = 'http://www.oauthprovider.com/auth'
export const testCallbackURI = vi.fn()

export const testCredentials = vi.fn()
export const testInternal = vi.fn()

export const secureHttpOnlyLaxCookieOption = { httpOnly: true, sameSite: 'lax', secure: true }

export const mockAuthURL = "https://www.acme.com/ayyopath/auth" as URLString
export const mockOriginURL = "https://feature-branch.acme.com"

export const sharedSettings = {
  authURL: mockAuthURL,
  cookie: mockCookie,
  expiry: 60 * 60 * 24 * 7,
  header: mockHeader,
  jwt: mockJwt,
  redirect: mockRedirect,
  secret: 'Secret123',
  request: {
    originURL: mockOriginURL,
  },
  providers: {
    p1: Provider({ authenticate: async () => ({ data: { [defaultUser]: { id: "sharedProviderTestID" } }, internal: {} }) })
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
            expect(mockCookie.set).toBeCalledWith('nu-redirect', '/dashboard', secureHttpOnlyLaxCookieOption)
          })
          it('should not call redirect', async () => {
            await signInAuth(sameOriginCurrentURL, undefined, undefined)
            expect(mockRedirect).not.toBeCalled()
          })
        })
        describe('redirect with path', () => {
          it('should call cookie.set with path', async () => {
            await signInAuth(sameOriginCurrentURL, undefined, '/a')
            expect(mockCookie.set).toBeCalledWith('nu-redirect', '/a', secureHttpOnlyLaxCookieOption)
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
              expect(mockCookie.set).toBeCalledWith('nu-redirect', 'https://www.acme.com/aaaa', secureHttpOnlyLaxCookieOption)
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
              expect(mockCookie.set).toBeCalledWith('nu-redirect', 'https://www.acme.com/aaaaayay', secureHttpOnlyLaxCookieOption)
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
    it('should remove cookie', async () => {
      await AuthCore(sharedSettings).signOut()
      expect(mockCookie.delete).toBeCalledWith('nu-auth')
    })
  })

  describe('Get Session', () => {
    describe('no session', () => {
      it('should return null', () => {
        expect(AuthCore(sharedSettings).getSession()).resolves.toEqual(null)
      })
    })
    describe('valid session', () => {
      it('should return session', async () => {
        mockCookie.get.mockReturnValue("Mocked")
        mockJwt.verify.mockReturnValue({ t: { id: "ValidSessionProviderIDTest" }, p: "p1", i: {}, e: nowInSeconds() + 500, iat: nowInSeconds(), iss: "nu-auth" })
        const session = await AuthCore({
          ...sharedSettings,
        }).getSession()
        expect(session).toEqual({ id: "ValidSessionProviderIDTest" })
      })
    })
    describe('invalid session', () => {
      it('should return null', async () => {
        mockCookie.get.mockReturnValue("Mocked")
        mockJwt.verify.mockReturnValue({ t: { id: "InvalidSessionProviderIDTest" }, p: "p1", i: {}, e: nowInSeconds() + 500, iat: nowInSeconds(), iss: "invalidIssuer" })
        const session = await AuthCore(sharedSettings).getSession()
        expect(session).toEqual(null)
      })
    })
    describe('expired session', () => {
      const
        mockJWTReturnValue
          = (
            id: string,
            internal: object
          ) => mockJwt.verify.mockReturnValue({ t: { id }, p: "p1", i: internal, e: 20, iat: 10, iss: "nu-auth" }),
        mockCookieReturnValue
          = () => mockCookie.get.mockReturnValue("Mocked"),
        mockIfAuthorizedIsCalled
          = vi.fn(),
        mockAuthCore = (authorize: Function) => AuthCore({
          ...sharedSettings, providers: {
            p1: Provider({
              authenticate: async () => ({} as any),
              authorize: authorize as any
            })
          }
        })

      describe('authorize method', () => {
        beforeEach(() => {
          mockCookieReturnValue()
        })
        it('should trigger the providers authorize method', async () => {
          mockJWTReturnValue('expiredSessionProviderIDTest', {})
          await mockAuthCore(async () => {
            mockIfAuthorizedIsCalled(true)
            return ({ update: false })
          }).getSession()
          expect(mockIfAuthorizedIsCalled).toBeCalledWith(true)
        })
        it('should receive internal data', async () => {
          mockJWTReturnValue('expiredSessionProviderIDTest', { hello: "world" })
          await mockAuthCore(async (data: any) => {
            mockIfAuthorizedIsCalled(data)
            return ({ update: false })
          }).getSession()
          expect(mockIfAuthorizedIsCalled).toBeCalledWith({ hello: "world" })
        })
        describe('returns update:true', () => {
          let session: any
          beforeEach(async () => {
            mockCookieReturnValue()
            mockJWTReturnValue('expiredSessionProviderIDTest', { hello: "world" })
            session = await mockAuthCore(async (data: any) => ({ update: true, newInternal: { hello: "bar" } })).getSession()
          })
          it('should call cookie.set', async () => expect(mockCookie.set).toBeCalledWith("nu-auth", "MockedJWT", { httpOnly: true, sameSite: "lax", secure: true }))
          it('should call jwt.sign', () => expect(mockJwt.sign).toBeCalledWith({ e: nowInSeconds() + sharedSettings.expiry, i: { hello: "bar" }, iat: nowInSeconds(), iss: "nu-auth", p: "p1", t: { id: "expiredSessionProviderIDTest" } }, "Secret123"))
          it('should return new session', () => expect(session).toEqual({ id: "expiredSessionProviderIDTest" }))
        })
        describe('returns update:false', () => {
          let session: any
          beforeEach(async () => {
            mockCookieReturnValue()
            mockJWTReturnValue('expiredSessionProviderIDTest', { hello: "world" })
            session = await mockAuthCore(async (data: any) => ({ update: false })).getSession()
          })
          it('should not call cookie.set', async () => expect(mockCookie.set).not.toBeCalled())
          it('should not call jwt.sign', async () => expect(mockJwt.sign).not.toBeCalled())
          it('should return null session', () => expect(session).toBeNull())
        })
      })
    })
  })

  describe('CSRF', () => {
    describe('createCSRF', () => {
      let csrf: any
      beforeEach(async () => csrf = await AuthCore({ ...sharedSettings, request: { method: 'GET', url: mockAuthURL + '/csrf', originURL: mockAuthURL + '/csrf' } }).requestHandler())
      it('should call cookie.set', async () => expect(mockCookie.set).toBeCalledWith('nu-csrf', expect.any(String), secureHttpOnlyLaxCookieOption))
      it('should return csrf', async () => expect(csrf).toEqual(expect.any(String)))
    })
    describe('checkCSRF', () => {
      describe('valid csrf', () => {
        beforeEach(() => {
          mockHeader.get.mockReturnValue("mockedCSRF123")
          mockCookie.get.mockReturnValue("mockedCSRF123")
        })
        it('should not throw error', async () => await expect(AuthCore(sharedSettings).checkCSRF()).resolves.not.toThrow())
      })
      describe('invalid csrf - mismatched value', () => {
        beforeEach(() => {
          mockHeader.get.mockReturnValue("mockedCSRF123")
          mockCookie.get.mockReturnValue("mockedCSRF321")
        })
        it('should throw error', async () => await expect(AuthCore({ ...sharedSettings }).checkCSRF()).rejects.toThrow('CSRF Token is invalid'))
      })
      describe('invalid csrf - missing header', () => {
        beforeEach(() => {
          mockCookie.get.mockReturnValue("mockedCSRF123")
          mockHeader.get.mockReturnValue(null)
        })
        it('should throw error', async () => await expect(AuthCore({ ...sharedSettings }).checkCSRF()).rejects.toThrow('CSRF Token is invalid'))
      })
      describe('invalid csrf - missing cookie', () => {
        beforeEach(() => {
          mockHeader.get.mockReturnValue("mockedCSRF123")
          mockCookie.get.mockReturnValue(null)
        })
        it('should throw error', async () => await expect(AuthCore({ ...sharedSettings }).checkCSRF()).rejects.toThrow('CSRF Token is invalid'))
      })
    })
  })

})



