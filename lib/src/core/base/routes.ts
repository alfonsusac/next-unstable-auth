export type AuthCoreRoutes =
  | 'signin'
  | 'signout'
  | 'callback'
  | 'session'
  | 'provider'
  | 'csrf'

export type AuthCoreRoutePaths
  = `/${ AuthCoreRoutes }`