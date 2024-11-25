import { beforeEach, describe, expect, it, vi } from "vitest"
import { sessionCookieOption, SessionHandler } from "../modules/session"
import { Providers } from "../modules/providers"
import { mockCookie } from "./module.cookie.test"
import { mockJwt } from "./module.jwt.test"
import { JWTHandler, nowInSeconds } from "../modules/jwt"

describe('Module: Session', () => {

  let session: SessionHandler<Providers, any>
  const cookieName = `CN`
  const iss = `ISSUER`
  const expiry = 100
  const secret = `SECRET`
  const jwtHandler = new JWTHandler(secret, mockJwt)

  beforeEach(() => {
    session = new SessionHandler(cookieName, iss, expiry, mockCookie, jwtHandler)
    vi.clearAllMocks()
  })

  // # Sessiong Handler Class
  describe('class SessionHandler', () => {

    // ## Set Method
    describe('set()', () => {

      const t = 'VAL', p = 'PID', i = 'INT'

      it('should call jwt.sign with token', () => {
        session.set(t, p, i)
        expect(mockJwt.sign).toHaveBeenCalledWith({
          t, p, i, iss,
          e: expect.any(Number),
          iat: expect.any(Number),
        }, secret)
      })
      it('should call cookie.set with token', () => {
        const tokenReturnValue = 'TOKEN'
        mockJwt.sign.mockReturnValue(tokenReturnValue)
        session.set(t, p, i)
        expect(mockCookie.set).toHaveBeenCalledWith(cookieName, tokenReturnValue, sessionCookieOption)
      })
    })

    // ## Get Method
    describe('get()', () => {
      it('should call cookie.get with token', () => {
        try { session.get() } catch { }
        expect(mockCookie.get).toHaveBeenCalledWith(cookieName)
      })
      it('should call jwt.verify with token', () => {
        mockCookie.get.mockReturnValue('TOKEN')
        try { session.get() } catch { }
        expect(mockJwt.verify).toHaveBeenCalledWith('TOKEN', secret)
      })
      it('should return token', () => {
        const mockInternalSession = {
          t: 'VAL', p: 'PID', i: 'INT',
          e: 101, iat: 100, iss,
        }
        mockJwt.verify.mockReturnValue(mockInternalSession)
        expect(session.get()).toEqual({
          token: {
            data: mockInternalSession.t,
            providerId: mockInternalSession.p,
            internal: mockInternalSession.i,
            expiry: mockInternalSession.e,
          }, expired: expect.any(Boolean)
        })
      })
      it('should return token and expired', () => {
        mockJwt.verify.mockReturnValue({
          t: 'VAL', p: 'PID', i: 'INT',
          e: 101, iat: 100, iss,
        })
        expect(session.get()).toEqual({
          token: expect.anything(), expired: true
        })
      })
      it('should return token and not expired', () => {
        mockJwt.verify.mockReturnValue({
          t: 'VAL', p: 'PID', i: 'INT',
          e: nowInSeconds() + 100, iat: 100, iss,
        })
        expect(session.get()).toEqual({
          token: expect.anything(), expired: false
        })
      })
      it('should return null token and null expired if no cookie', () => {
        mockCookie.get.mockReturnValue(null)
        expect(session.get()).toEqual({ token: null, expired: null })
      })
      it('should throw error if session is invalid', () => {
        mockCookie.get.mockReturnValue('-')
        mockJwt.verify.mockReturnValue(undefined)
        expect(() => session.get()).toThrowError("Invalid session")
      })
      it('should throw error if session has invalid issuer', () => {
        mockCookie.get.mockReturnValue('-')
        mockJwt.verify.mockReturnValue({
          t: 'VAL', p: 'PID', i: 'INT',
          e: nowInSeconds() + 100, iat: 100, iss: 'INVALID',
        })
        expect(() => session.get()).toThrowError("Invalid issuer")
      })
      it('should throw error if session has invalid expiry', () => {
        mockCookie.get.mockReturnValue('TOKEN')
        mockJwt.verify.mockReturnValue({
          t: 'VAL', p: 'PID', i: 'INT',
          e: 90, iat: 100, iss: iss,
        })
        expect(() => session.get()).toThrowError("Invalid expiry")
      })
    })
    
    // # Clear Method
    describe('clear()', () => {
      it('should call cookie.delete',
        () => {
          session.clear()
          expect(mockCookie.delete).toHaveBeenCalled()
        })
    })
  })
})