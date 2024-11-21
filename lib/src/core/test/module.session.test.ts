import { beforeEach, describe, expect, it, vi } from "vitest"
import { sessionCookieOption, SessionHandler } from "../modules/session"
import { Providers } from "../modules/providers"
import { mockCookie } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { JWTHandler, nowInSeconds } from "../modules/jwt"



describe('Module: Session', () => {

  let session: SessionHandler<Providers, any>

  const cookieName = `CN`
  const issuer = `ISSUER`
  const expiry = 100
  const secret = `SECRET`

  beforeEach(() => {
    session = new SessionHandler(
      cookieName,
      issuer,
      expiry,
      mockCookie,
      new JWTHandler(secret, mockJwt),
    )
    vi.clearAllMocks()
  })

  describe('SessionHandler', () => {
    describe('set()', () => {
      const args = ['VAL', 'PID', 'INT'] as const
      it('should call jwt.sign with token',
        () => {
          session.set(...args)
          expect(mockJwt.sign).toHaveBeenCalledWith({
            t: args[0],
            p: args[1],
            i: args[2],
            e: expect.any(Number),
            iat: expect.any(Number),
            iss: issuer,
          }, secret)
        })

      it('should call cookie.set with token',
        () => {
          mockJwt.sign.mockReturnValue('TOKEN')
          session.set(...args)
          expect(mockCookie.set).toHaveBeenCalledWith("CN", "TOKEN", sessionCookieOption)
        })

    })

    describe('get()', () => {

      it('should call cookie.get with token',
        () => {
          try {
            session.get()
            expect(mockCookie.get).toHaveBeenCalledWith("CN")
          } catch { }
        })

      it('should call jwt.verify with token',
        () => {
          try {
            mockCookie.get.mockReturnValue('TOKEN')
            session.get()
            expect(mockJwt.verify).toHaveBeenCalledWith('TOKEN', secret)
          } catch { }
        })

      it('should return token and expired',
        () => {
          const token = 'TOKEN'
          const mockInternalSession = {
            t: 'VAL',
            p: 'PID',
            i: 'INT',
            e: 100,
            iat: 100,
            iss: issuer,
          }
          mockCookie.get.mockReturnValue(token)
          mockJwt.verify.mockReturnValue(mockInternalSession)
          expect(session.get()).toEqual({
            token: {
              data: mockInternalSession.t,
              providerId: mockInternalSession.p,
              internal: mockInternalSession.i,
              expiry: mockInternalSession.e,
            }, expired: true
          })
        })

      it('should return token and not expired',
        () => {
          const token = 'TOKEN'
          const mockInternalSession = {
            t: 'VAL',
            p: 'PID',
            i: 'INT',
            e: nowInSeconds() + 1000,
            iat: 100,
            iss: issuer,
          }
          mockCookie.get.mockReturnValue(token)
          mockJwt.verify.mockReturnValue(mockInternalSession)
          expect(session.get()).toEqual({
            token: {
              data: mockInternalSession.t,
              providerId: mockInternalSession.p,
              internal: mockInternalSession.i,
              expiry: mockInternalSession.e,
            }, expired: false
          })
        })

      it('should return null token and null expired if no cookie',
        () => {
          mockCookie.get.mockReturnValue(null)
          expect(session.get()).toEqual({ token: null, expired: null })
        })

      it('should throw error if session is invalid',
        () => {
          mockCookie.get.mockReturnValue('TOKEN')
          mockJwt.verify.mockReturnValue(undefined)
          expect(() => session.get()).toThrowError("Invalid issuer")
        })

      it('should throw error if session has invalid issuer',
        () => {
          const mockInternalSession = {
            t: 'VAL',
            p: 'PID',
            i: 'INT',
            e: nowInSeconds() + 1000,
            iat: 100,
            iss: 'INVALID',
          }
          mockCookie.get.mockReturnValue('TOKEN')
          mockJwt.verify.mockReturnValue(mockInternalSession)
          expect(() => session.get()).toThrowError("Invalid session")
        })

      it('should throw error if session has invalid expiry',
        () => {
          const mockInternalSession = {
            t: 'VAL',
            p: 'PID',
            i: 'INT',
            e: 90,
            iat: 100,
            iss: issuer,
          }
          mockCookie.get.mockReturnValue('TOKEN')
          mockJwt.verify.mockReturnValue(mockInternalSession)
          expect(() => session.get()).toThrowError("Invalid session")
        })

    })

    describe('clear()', () => {

      it('should call cookie.delete',
        () => {
          session.clear()
          expect(mockCookie.delete).toHaveBeenCalled()
        })

      it('should return true',
        () => {
          expect(session.clear()).toBe(true)
        })

    })



  })


})