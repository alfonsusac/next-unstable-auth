import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { AuthCore } from ".."
import { mockJwt } from "./module.jwt.test"
import { nowInSeconds } from "../modules/jwt"
import { mockRedirect, sharedSettings } from "./core.test"
import { mockCookie } from "./module.cookie.test"

export function testSignInMethod(
  name: string,
  authCore: AuthCore<any, any, any>,
  expected: {
    token: {
      p1: any,
      p2: any,
      p3: any,
    },
    session: {
      p1: any,
      p2: any,
      p3: any,
    },
    internal: {
      p1: any,
      p2: any,
      p3: any,
    },
    param: {
      p1: any,
      p2: any,
      p3: any,
    }
  }
) {

  describe(name, () => {

    const auth = authCore

    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('general case', () => {

      it('should return correct session',
        async () => {
          const session = await auth.signIn("p1", undefined)
          expect(session).toEqual(expected.session.p1)
        })

      it('should call jwt.sign with correct payload',
        async () => {
          mockJwt.sign.mockReturnValue("MockedJWT")
          await auth.signIn("p1", undefined)
          expect(mockJwt.sign).toBeCalledWith({
            e: nowInSeconds() + sharedSettings.expiry,
            i: expected.internal.p1,
            iat: nowInSeconds(),
            iss: "nu-auth",
            p: "p1",
            t: expected.token.p1
          }, sharedSettings.secret)
        })
    })

    describe('with fields', () => {
      it('should return correct session',
        async () => {
          const session = await auth.signIn("p2", expected.param.p2)
          expect(session).toEqual(expected.session.p2)
        })
      it('should call jwt.sign with correct payload',
        async () => {
          mockJwt.sign.mockReturnValue("MockedJWT")
          await auth.signIn("p2", expected.param.p2)
          expect(mockJwt.sign).toBeCalledWith({
            e: nowInSeconds() + sharedSettings.expiry,
            i: expected.internal.p2,
            iat: nowInSeconds(),
            iss: "nu-auth",
            p: "p2",
            t: expected.token.p2
          }, sharedSettings.secret)
        })
    })

    it('should redirect to callbackURI if prompted by provider',
      async () => {
        await auth.signIn("p3", undefined)
        expect(mockRedirect).toHaveBeenCalledWith("/ayyopath/callback/p3")
      })

    it('should set cookie if prompted by provider',
      async () => {
        await auth.signIn("p3", undefined)
        expect(mockCookie.set).toHaveBeenCalledWith("a", "b")
      })

    it('should throw if provider does not exist',
      async () => {
        // @ts-expect-error
        await expect(auth.signIn("p4")).rejects.toThrowError("Invalid provider ID: p4")
      })

    it('should throw if provider does not have fields',
      async () => {
        // @ts-expect-error
        await expect(auth.signIn("p2")).rejects.toThrowError("Credentials required for this provider")
      })

  })


}