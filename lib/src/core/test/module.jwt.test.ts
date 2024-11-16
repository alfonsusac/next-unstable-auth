import { beforeEach, describe, expect, it, vi } from "vitest"
import { JWTWrapper } from "../modules/jwt"

export const mockJwt = {
  sign: vi.fn(),
  verify: vi.fn(),
};

describe('Module: JWT', () => {

  let jwt: JWTWrapper
  let secret = 'secret'
  beforeEach(
    () => jwt = new JWTWrapper(secret, mockJwt)
  )

  it('should call jwt.sign with secret when sign is called', () => {
    const payload = { userId: `123` }
    jwt.sign(payload)
    expect(mockJwt.sign).toHaveBeenCalledWith(payload, secret)
  })

  it('should call jwt.verify with secret when verify is called', () => {
    const token = 'token'
    jwt.verify(token)
    expect(mockJwt.verify).toHaveBeenCalledWith(token, secret)
  })

})