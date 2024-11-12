import { ValidationError } from "../../util/error"
import { DefaultUser } from "../modules/providers"

export const defaultValidateToken = (token: unknown) => {
  if (typeof token !== 'object' || !token)
    throw new ValidationError('Default User is not an object or is missing')

  if (!('id' in token && typeof token.id === 'string'))
    throw new ValidationError('Default User ID is missing')

  if (typeof token.id !== 'string')
    throw new ValidationError('Default User ID is not a string')

  if ('name' in token && token.id && typeof token.name !== 'string')
    throw new ValidationError('Default User Name is not a string')

  if ('email' in token && typeof token.email !== 'string')
    throw new ValidationError('Default User Email is not a string')

  if ('image' in token && typeof token.image !== 'string')
    throw new ValidationError('Default User Image is not a string')

  return token as DefaultUser
} 