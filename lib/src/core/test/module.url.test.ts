import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { isPath, isURL } from "../modules/url"
import { processRedirectURLWithProxy } from "../modules/redirect"

describe('Module: URL', () => {

  describe('isPath', () => {
    it('should return true if the URL is a path', () => {
      const res = isPath('/path/to/somewhere')
      expect(res).toBe(true)
    })
    it('should return true if the URL is not a path', () => {
      const res = isPath('path/to/somewhere')
      expect(res).toBe(false)
    })
    it('should return true if not a string', () => {
      const res = isPath(123)
      expect(res).toBe(false)
    })
  })

  describe('isURL', () => {
    it('should return true if url is valid', () => {
      const res = isURL('https://example.com')
      expect(res).toBe(true)
    })
    it('should return false if url is invalid', () => {
      const res = isURL('example.com')
      expect(res).toBe(false)
    })
    it('should return false if not a string', () => {
      const res = isURL(123)
      expect(res).toBe(false)
    })
  })

  describe('processRedirectURLWithProxy', () => {

    function testRedirectURLWithProxy($: {
      name: string,
      baseURL: string,
      originURL?: string,
      target?: string,
      expected: string,
    }) {
      it($.name, () => {
        const url = processRedirectURLWithProxy($ as any)
        expect(url).toBe($.expected)
      })
    }

    function testWithTarget(name: string, target: string | undefined, expected: {
      proxied: {
        value: string,
        description: string,
      },
      notProxied: {
        value: string,
        description: string,
      },
      noOriginURL: {
        value: string,
        description: string,
      },
    }) {
      describe(name, () => {
        testRedirectURLWithProxy({
          name: `should return ${ expected.proxied.description } if proxied`,
          baseURL: 'https://example.com/api/auth',
          originURL: 'https://feature.acme.com/auth/signIn',
          target,
          expected: expected.proxied.value,
        })
        testRedirectURLWithProxy({
          name: `should return ${ expected.notProxied.description } if not proxied`,
          baseURL: 'https://example.com/api/auth',
          originURL: 'https://example.com/auth/signIn',
          target,
          expected: expected.notProxied.value,
        })
        testRedirectURLWithProxy({
          name: `should return ${ expected.noOriginURL.description } if no originURL`,
          baseURL: 'https://example.com/api/auth',
          target,
          expected: expected.noOriginURL.value,
        })
      })
    }

    testWithTarget('no target provided', undefined, {
      proxied: { description: 'originURL', value: 'https://feature.acme.com/auth/signIn' },
      notProxied: { description: "origin's path", value: '/auth/signIn' },
      noOriginURL: { description: "/", value: '/' },
    })

    testWithTarget('target is a path', '/dashboard', {
      proxied: { description: 'origin + target', value: 'https://feature.acme.com/dashboard' },
      notProxied: { description: "target", value: '/dashboard' },
      noOriginURL: { description: "target", value: '/dashboard' },
    })

    testWithTarget('target is an URL', 'https://www.golge.com/dashboard', {
      // TODO - CHECK IF ITS IN ALLOWEDORIGINS
      proxied: { description: 'target', value: 'https://www.golge.com/dashboard' },
      notProxied: { description: "target", value: 'https://www.golge.com/dashboard' },
      noOriginURL: { description: "target", value: 'https://www.golge.com/dashboard' },
    })

    testWithTarget('target is relative path', 'dashboard', {
      proxied: { description: 'origin + target', value: 'https://feature.acme.com/auth/dashboard' },
      notProxied: { description: "target", value: 'dashboard' },
      noOriginURL: { description: "target", value: 'dashboard' },
    })

    testWithTarget('target is relative path with dot', './dashboard', {
      proxied: { description: 'origin + target', value: 'https://feature.acme.com/auth/dashboard' },
      notProxied: { description: "target", value: './dashboard' },
      noOriginURL: { description: "target", value: './dashboard' },
    })

    testWithTarget('target is dot', '.', {
      proxied: { description: 'origin + target', value: 'https://feature.acme.com/auth/' },
      notProxied: { description: "target", value: '.' },
      noOriginURL: { description: "target", value: '.' },
    })
    
  })
})