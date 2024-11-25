import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { Redirect } from "../modules/redirect"
import { Provider } from "../modules/providers"
import { AuthCore } from ".."
import { mockCookie, mockHeader } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { Config } from "../modules/config"

export const mockRedirect = vi.fn<Redirect>()

describe('Module: Config', () => {

  it('should be able to create an instance', () => {
    const auth = AuthCore({
      expiry: 60 * 60 * 24 * 7,
      secret: "123",
      authPath: "/auth",
      authURL: "http://localhost:3000",
      providers: {},
      request: {
        originURL: "http://localhost:3000",
      },
      cookie: mockCookie,
      jwt: mockJwt,
      header: mockHeader,
      redirect: mockRedirect,
    })
    expect(auth).toBeDefined()
    expect(auth).toBeTypeOf("object")
    expect(auth.signIn).toBeTypeOf("function")
    expect(auth.signOut).toBeTypeOf("function")
    expect(auth.callback).toBeTypeOf("function")
    expect(auth.getProvider).toBeTypeOf("function")
    expect(auth.getSession).toBeTypeOf("function")
    expect(auth.requestHandler).toBeTypeOf("function")
    expect(auth.config).toBeDefined()
    expect(auth.$Infer).toBeDefined()
    expectTypeOf(auth.$Infer.Providers).toEqualTypeOf<{}>()
    expectTypeOf(auth.$Infer.Token).toEqualTypeOf<never>()
    expectTypeOf(auth.$Infer.Session).toEqualTypeOf<never>()
    expectTypeOf(auth.$Infer.Config).toEqualTypeOf<Config<{}, never, never>>()
  })

  const correctConfig = {
    expiry: 60 * 60 * 24 * 7,
    secret: "123",
    authPath: "/auth",
    authURL: "http://localhost:3000",
    providers: {},
    request: {
      originURL: "http://localhost:3000",
    },
    cookie: mockCookie,
    jwt: mockJwt,
    header: mockHeader,
    redirect: mockRedirect,
  }

  const scenarios = [
    { key: "expiry", value: null, expectedError: "Config.Expiry must be a number" },
    { key: "expiry", value: -1, expectedError: "Config.Expiry must be greater than 0" },
    { key: "secret", value: null, expectedError: "Config.Secret must be a string" },
    { key: "authPath", value: null, expectedError: "Config.AuthPath must be a string and starts with /" },
    { key: "authPath", value: "api/auth", expectedError: "Config.AuthPath must be a string and starts with /" },
    { key: "authURL", value: null, expectedError: "Config.BaseURL must be a string. Received null" },
    { key: "authURL", value: "www.acme.com", expectedError: "Config.BaseURL must start with http. Received www.acme.com" },
    { key: "providers", value: null, expectedError: "Config.Providers must be an object" },
    { key: "providers", value: { p1: Provider(null as any) }, expectedError: "Config.Providers.p1 must be an object" },
    { key: "providers", value: { p1: Provider({ authorize: async () => ({ update: false }) } as any) }, expectedError: "Config.Providers.p1.Authenticate must be a function" },
    { key: "providers", value: { p1: Provider({ authenticate: async () => ({ update: false }) } as any) }, expectedError: "Config.Providers.p1.Authorize must be a function" },
    { key: "providers", value: { p1: Provider({ authenticate: async () => ({ update: false }), authorize: async () => ({ update: false }), fields: 2 } as any), }, expectedError: "Config.Providers.p1.Fields must be a function" },
    { key: "request", value: null, expectedError: "Config.Request must be an object" },
    { key: "request", value: { originURL: 13 }, expectedError: "Config.Request.originURL must be a string. Received 13" },
    { key: "request", value: { originURL: "http://a.com", method: 123 }, expectedError: "Config.Request.Method must be a valid HTTP method" },
    { key: "cookie", value: null, expectedError: "Config.Cookie must be an object" },
    { key: "cookie", value: {}, expectedError: "Config.Cookie.get must be a function" },
    { key: "cookie", value: { get: () => { } }, expectedError: "Config.Cookie.set must be a function" },
    { key: "cookie", value: { get: () => { }, set: () => { } }, expectedError: "Config.Cookie.delete must be a function" },
    { key: "jwt", value: null, expectedError: "Config.JWT is required" },
    { key: "jwt", value: {}, expectedError: "Config.JWT.sign must be a function" },
    { key: "jwt", value: { sign: () => { } }, expectedError: "Config.JWT.verify must be a function" },
    { key: "header", value: null, expectedError: "Config.Header must be an object" },
    { key: "header", value: { get: () => { } }, expectedError: "Config.Header.set must be a function" },
    { key: "redirect", value: null, expectedError: "Config.Redirect must be a function" },
    { key: "session", value: { cookieName: 1 }, expectedError: "Config.Session.CookieName must be a string" },
    { key: "session", value: { issuer: 2 }, expectedError: "Config.Session.Issuer must be a string" },
    { key: "toToken", value: {}, expectedError: "Config.ToToken must be a function" },
    { key: "toSession", value: {}, expectedError: "Config.ToSession must be a function" },
    { key: "validate", value: {}, expectedError: "Config.Validate must be a function" },
  ]

  scenarios.forEach((scene) => {
    it(`should throw error when ${ scene.key } is ${ JSON.stringify(scene.value) }`, () => {
      expect(() => {
        AuthCore({ ...correctConfig, [scene.key]: scene.value } as any)
      }).toThrow(scene.expectedError)
    })
  })
})
