import { sign, verify } from 'jsonwebtoken'

export const jwt = {
  create: (payload: unknown, secret: string) => sign(JSON.stringify(payload), secret),
  verify: (token: string, secret: string) => {
    const res = verify(token, secret, {
      ignoreExpiration: true,
    })
    if (typeof res === 'string') return JSON.parse(res)
    return res
  },
}