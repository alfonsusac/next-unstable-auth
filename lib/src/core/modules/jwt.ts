import { ConfigError } from "./error"

export class JWTWrapper {
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



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 



export function validateJWT(jwt: unknown) {
  if (!jwt)
    throw new ConfigError('JWT is required')
  if (typeof jwt !== 'object')
    throw new ConfigError('JWT must be an object')
  if ('sign' in jwt === false || typeof jwt['sign'] !== 'function')
    throw new ConfigError('JWT.sign must be a function')
  if ('verify' in jwt === false || typeof jwt['verify'] !== 'function')
    throw new ConfigError('JWT.verify must be a function')
  return jwt as JWT
}