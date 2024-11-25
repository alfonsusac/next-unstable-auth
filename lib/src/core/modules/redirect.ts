import { isPath, isURL, PathLike, URLLike } from "./url"

export type Redirect = (to: string) => never

export function validateRedirectTo(pathOrURL: string) {
  if (pathOrURL.startsWith('/')) {
    return true
  }
  try {
    new URL(pathOrURL)
    return true
  } catch (error) {
    throw new Error('Invalid Redirect URL. Must be an URL or starts with \'/\'')
  }
}


export function processRedirectURLWithProxy($: {
  baseURL: URLLike,
  originURL?: URLLike,
  target?: URLLike | PathLike
}) {
  // If no origin URL is provided, return the target URL
  // no origin URL therefore assumes the request was made from the base URL
  if (!$.originURL) {
    return $.target ?? '/'
  }

  const isProxied = new URL($.originURL).origin !== new URL($.baseURL).origin

  // If request was made from a different URL than the base URL
  if (isProxied) {
    // If target is URL, it will override the origin URL
    // If target is path, it will be resolved to the origin URL
    // If target is not a valid URL or path, throw an error
    return new URL($.target ?? '', $.originURL).toString()
  } else {
    return $.target ?? new URL($.originURL).pathname
  }






















  // if ($.target) {
  //   // If target URL is provided, check if it is path or url
  //   if (isPath($.target)) {
  //     // If its path, check whether the request was made from base URL or not
  //     if (isProxied) {
  //       // If request was made from a different URL, return the origin URL + target path
  //       return $.originURL + $.target
  //     } else {
  //       // If request was made from the base URL, return the target path
  //       return $.target
  //     }
  //   }
  //   if (isURL($.target)) {
  //     // If its URL, return the URL
  //     return $.target
  //   }
  //   throw new Error('Invalid Redirect URL. Must be an URL or starts with \'/\'')
  // } else {
  //   if (isProxied) {
  //     // If target URL is not provided, 
  //     // return the origin URL where the request was made 
  //     return $.originURL ?? $.baseURL
  //   } else {
  //     // If target URL is not provided, 
  //     // return the origin URL where the request was made 
  //     // or the relative root path of where the request was made
  //     return originURL.pathname
  //   }
  //   // If target URL is not provided, 
  //   // return the origin URL where the request was made 
  //   // or the relative root path of where the request was made
  //   return '/'
  // }
  /**
   * Possible values or return values:
   * 1. $.originURL + $.target
   * 2. $.target
   * 3. $.target
   * 4. $.originURL
   * 5. '/'
   * 
   * or
   * 
   * 1. https://feature.acme.com + /dashboard
   * 2. /dashboard
   * 3. https://feature.acme.com/dashboard
   * 4. https://feature.acme.com
   * 5. /
   */
}