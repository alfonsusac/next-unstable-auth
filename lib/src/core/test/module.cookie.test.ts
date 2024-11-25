import { beforeEach, describe, expect, it, vi } from "vitest"
import { CookieStore, OneTimeCookieStore, validateCookieConfig } from "../modules/cookie";
import { validateHeaderConfig } from "../modules/header";

export const mockCookie = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

export const mockHeader = {
  get: vi.fn(),
  set: vi.fn(),
}

describe('Module: Cookie', () => {

  let cookie: CookieStore
  const cookieName = 'AA'
  const cookieSettings = {
    secure: true
  }
  beforeEach(
    () => {
      cookie = new CookieStore(mockCookie, cookieName, cookieSettings)
      vi.clearAllMocks()
    }
  )

  describe('CookieHandler', () => {
    describe('get()', () => {
      it('should throw error if value is not valid', () => {
        expect(() => cookie.get()).toThrowError('Value of Cookie.get must be a string')
      })
      it('should return value if value is valid', () => {
        mockCookie.get.mockReturnValue('BB')
        expect(cookie.get()).toBe('BB')
      })
      it('should return null if cookie.get returns null', () => {
        mockCookie.get.mockReturnValue(null)
        expect(cookie.get()).toBe(null)
      })
      it('should call cookie.get with name', () => {
        try { cookie.get() } catch { }
        expect(mockCookie.get).toHaveBeenCalledWith(cookieName)
      })
    })
    describe('set()', () => {
      it('should call cookie.set with name and value when set() is called', () => {
        const value = 'BB'
        cookie.set(value)
        expect(mockCookie.set).toHaveBeenCalledWith(cookieName, value, cookieSettings)
      })
    })
    describe('cler()', () => {
      it('should call cookie.delete with name when clear is called', () => {
        cookie.clear()
        expect(mockCookie.delete).toHaveBeenCalledWith(cookieName)
      })
    })
  })



  describe('OneTimeCookieStore', () => {

    const validate = (value: string) => value === 'valid'
    let oneTimeCookie: OneTimeCookieStore

    beforeEach(
      () => oneTimeCookie = new OneTimeCookieStore(mockCookie, cookieName, undefined, validate)
    )

    it('should not set value if validation fails', () => {
      oneTimeCookie.set('invalid')
      expect(mockCookie.set).not.toHaveBeenCalled()
    })
    it('should set value if validation passes', () => {
      oneTimeCookie.set('valid')
      expect(mockCookie.set).toHaveBeenCalledWith(cookieName, 'valid', undefined)
    })
    it('should return value and delete cookie when use is called', () => {
      mockCookie.get.mockReturnValue('valid')
      const value = oneTimeCookie.use()
      expect(value).toBe('valid')
      expect(mockCookie.delete).toHaveBeenCalledWith(cookieName)
    })
    it('should return false if value is not same as used value', () => {
      mockCookie.get.mockReturnValue('valid')
      expect(oneTimeCookie.verify('invalid')).toBe(false)
    })
    it('should return true if value is same as used value', () => {
      mockCookie.get.mockReturnValue('valid')
      expect(oneTimeCookie.verify('valid')).toBe(true)
    })
  })

  describe('Cookie Handler Dependency', () => {
    it('should validate cookie dependency', () => {
      expect(() => validateCookieConfig(mockCookie)).not.toThrowError()
      expect(() => validateCookieConfig(null as any)).toThrowError()
    })
    it('should validate header dependency', () => {
      expect(() => validateHeaderConfig(mockHeader)).not.toThrowError()
      expect(() => validateHeaderConfig(null as any)).toThrowError()
    })
  })
})