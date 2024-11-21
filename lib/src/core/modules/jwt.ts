export type JWT = {
  sign: (payload: any, secret: string) => string
  verify: (token: string, secret: string) => unknown
}

export class JWTHandler {
  constructor(
    private secret: string,
    private jwt: JWT
  ) { }
  sign(payload: any) {
    return this.jwt.sign(payload, this.secret)
  }
  verify(token: string) {
    return this.jwt.verify(token, this.secret)
  }
}

export function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}