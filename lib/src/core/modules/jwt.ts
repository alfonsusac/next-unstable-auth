export class JWTWrapper{
  constructor(
    private secret: string,
    private jwt: JWT
  ) { }
  sign(payload: any) {
    this.jwt.sign(payload, this.secret)
  }
  verify(token: string) {
    this.jwt.verify(token, this.secret)
  }
}


export type JWT = {
  sign: (payload: any, secret: string) => string
  verify: (token: string, secret: string) => unknown
}

export function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}