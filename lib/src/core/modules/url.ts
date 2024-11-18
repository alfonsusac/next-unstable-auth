export function getPathFromURL(url: string | URL | null | undefined) {
  if (!url)
    return '/' as `/${ string }`

  let pathname: string
  if (url instanceof URL) {
    pathname = url.pathname;
  }
  else {
    pathname = new URL(url).pathname;
  }
  if (!pathname.startsWith('/'))
    return '/' as `/${ string }`
  return pathname as `/${ string }`
}