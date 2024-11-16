import { beforeEach, describe, expect, it, vi } from "vitest"
import { CookieStore, OneTimeCookieStore, validateCookie, validateHeader } from "../modules/cookie";

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
  beforeEach(
    () => {
      cookie = new CookieStore(mockCookie, cookieName)
      vi.clearAllMocks()
    }
  )



  describe('CookieHandler', () => {

    it('should call cookie.get with name when get() is called', () => {
      cookie.get()
      expect(mockCookie.get).toHaveBeenCalledWith(cookieName)
    })

    it('should call cookie.set with name and value when set() is called', () => {
      const value = 'BB'
      cookie.set(value)
      expect(mockCookie.set).toHaveBeenCalledWith(cookieName, value, undefined)
    })

    it('should not throw error on set() if value is not valid', () => {
      expect(() => cookie.set(undefined as any)).not.toThrowError()
      expect(mockCookie.set).toHaveBeenCalledWith(cookieName, undefined, undefined)
    })

    it('should call cookie.delete with name when clear is called', () => {
      cookie.clear()
      expect(mockCookie.delete).toHaveBeenCalledWith(cookieName)
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

    it('should return error if invalid dependency', () => {
      expect(() => new CookieStore(null as any, null as any, null as any)).toThrowError()
    })

    it('should validate cookie dependency', () => {
      expect(() => validateCookie(mockCookie)).not.toThrowError()
      expect(() => validateCookie(null as any)).toThrowError()
    })

    it('should validate header dependency', () => {
      expect(() => validateHeader(mockHeader)).not.toThrowError()
      expect(() => validateHeader(null as any)).toThrowError()
    })

  })

})