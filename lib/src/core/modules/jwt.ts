export type JWT = {
  sign: (payload: any, secret: string) => string
  verify: (token: string, secret: string) => unknown
}

export function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}