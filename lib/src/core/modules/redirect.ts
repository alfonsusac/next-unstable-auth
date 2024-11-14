
export type Redirect = (url: string) => never

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
