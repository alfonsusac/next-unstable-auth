import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthCore } from ".."
import { mockJwt } from "./module.jwt.test"
import { nowInSeconds } from "../modules/jwt"
import { sharedSettings, testCredentials, testInternal } from "./core.test"
import { mockCookie } from "./module.cookie.test"

export function testSignInMethod(
  name: string,
  authCore: AuthCore<any, any, any>,
  expected: Record<"p1" | "p2", {
    token: any,
    session: any,
    internal: any,
    param?: any
  }>
) {

  describe(name, () => {

    const auth = authCore

    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('General case', () => {
      it('should return correct session', async () => {
        const session = await auth.signIn("p1", undefined)
        expect(testCredentials).toBeCalledWith(undefined)
        expect(session).toEqual(expected.p1.session)
      })
      it('should call jwt.sign with correct payload', async () => {
        mockJwt.sign.mockReturnValue("MockedJWT")
        await auth.signIn("p1", undefined)
        // expect(testInternal).toBeCalledWith(expected.p1.token)
        expect(mockJwt.sign).toBeCalledWith({
          e: nowInSeconds() + sharedSettings.expiry,
          i: expected.p1.internal,
          iat: nowInSeconds(),
          iss: "nu-auth",
          p: "p1",
          t: expected.p1.token
        }, sharedSettings.secret)
      })
      it('should call authorize when expired', async () => {
        mockCookie.get.mockReturnValue("MockedCookie")
        mockJwt.verify.mockReturnValue({
          e: nowInSeconds() - 90,
          i: expected.p1.internal,
          iat: nowInSeconds() - 100,
          iss: "nu-auth",
          p: "p1",
          t: expected.p1.token
        })
        await auth.getSession()
        expect(testInternal).toBeCalledWith(expected.p1.internal, "general")
      })
    })

    describe('General case with fields', () => {
      it('should return correct session', async () => {
        const session = await auth.signIn("p2", expected.p2.param)
        expect(testCredentials).toBeCalledWith(expected.p2.param)
        expect(session).toEqual(expected.p2.session)
      })
      it('should call jwt.sign with correct payload', async () => {
        mockJwt.sign.mockReturnValue("MockedJWT")
        await auth.signIn("p2", expected.p2.param)
        expect(mockJwt.sign).toBeCalledWith({
          e: nowInSeconds() + sharedSettings.expiry,
          i: expected.p2.internal,
          iat: nowInSeconds(),
          iss: "nu-auth",
          p: "p2",
          t: expected.p2.token
        }, sharedSettings.secret)
      }),
      it('should call authorize when expired', async () => {
        mockCookie.get.mockReturnValue("MockedCookie")
        mockJwt.verify.mockReturnValue({
          e: nowInSeconds() - 90,
          i: expected.p2.internal,
          iat: nowInSeconds() - 100,
          iss: "nu-auth",
          p: "p2",
          t: expected.p1.token
        })
        await auth.getSession()
        expect(testInternal).toBeCalledWith(expected.p2.internal, "withFields")
      })
    })

  })
}