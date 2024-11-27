import { isString } from "./validation";

export type URLString
  = `${ string }://${ string }`

export function validateURL(o: unknown, name: string): URLString {
  if (!isString(o))
    throw new Error(`${ name } must be a string. Received ${ String(o) }`)
  if (!o.startsWith('http'))
    throw new Error(`${ name } must start with http. Received ${ String(o) }`)
  if (!o.includes('://'))
    throw new Error(`${ name } must include ://. Received ${ String(o) }`)
  // if (o.endsWith('/'))
  //   throw new Error(`${ name } must not end with /. Received ${ String(o) }`)
  try {
    new URL(o)
  } catch {
    throw new Error(`${ name } is not a valid URL. Received ${ String(o) }`)
  }
  return o as URLString
}

export function isURL(o: unknown): o is URLString {
  try {
    validateURL(o, 'URL')
    return true
  } catch {
    return false
  }
}



export type AbsolutePath = `/${ string }`

export function validatePath(o: unknown, name: string): AbsolutePath {
  if (!isString(o))
    throw new Error(`${ name } must be a string. Received ${ String(o) }`)
  if (!o.startsWith('/'))
    throw new Error(`${ name } must start with /. Received ${ String(o) }`)
  return o as AbsolutePath
}

export function isPath(o: unknown): o is AbsolutePath {
  try {
    validatePath(o, 'Path')
    return true
  } catch {
    return false
  }
}


export function isSameOrigin(url1: string | URL, url2: string | URL) {
  const u1 = new URL(url1)
  const u2 = new URL(url2)
  return u1.origin === u2.origin
}

/**
 * Retrieve the origin URL from the request headers.
 */
// export function getUserOriginURL($: {
//   url?: string,
//   request: () => Request,
//   header: Headers,
// }) {
//   try {
//     // Provide a way to directly use the provided URL
//     if ($.url)
//       return new URL($.url)
  
//     // Infer from header
//     const referer = $.header.get('referer')
//     const xproto = $.header.get('x-forwarded-proto')
//     const xhost = $.header.get('x-forwarded-host')
//     let cause: string = ""
//     if (referer) {
//       // make sure referer is consistent with x-forwarded-*
//       const refererURL = new URL(referer)
//       if (refererURL.host === xhost && refererURL.protocol === xproto)
//         return refererURL
//       throw new Error("URL from referer header doesn't match x-forwarded-* headers")
//     }
//     // if no referer,
//     // make sure request url is consistent with x-forwarded-*
//     const reqURL = new URL($.request().url)
//     if (reqURL.host === xhost && reqURL.protocol === xproto)
//       return reqURL
  
    
//   } catch (error) {
//     throw new Error(`Unable to get origin URL: ${ error instanceof Error ? error.message : error }`)
//   }
// }