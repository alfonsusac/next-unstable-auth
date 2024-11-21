export class Route {
  constructor(
    public readonly method: string,
    public readonly url: `${ string }://${ string }`,
  ) { }
}


const routes = {
  signIn: 'POST /sign-in',
  signOut: 'POST /sign-out',
  callback: 'GET /callback',
  csrf: 'GET /csrf',
  session: 'GET /session',
  provider: 'GET /provider',
} as const

export type AuthRoutes = typeof routes[keyof typeof routes]

export function getURLFromRoute(
  baseURL: `${ string }://${ string }`,
  authPath: `/${ string }`,
  route: keyof typeof routes,
  ...segments: string[]
) {
  return `${ baseURL }${ authPath }${ routes[route].split(' ')[1] }/${ segments.join('/') }`
}