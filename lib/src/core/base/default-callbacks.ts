import { DefaultT } from "../modules/config"
import { defaultUser, DefaultUser, Providers } from "../modules/providers"

export const defaultValidateToken = (token: unknown) => {
  if (typeof token !== 'object' || !token)
    throw new Error('Default User is not an object or is missing')

  if (!('id' in token && typeof token.id === 'string'))
    throw new Error('Default User ID is missing')

  if (typeof token.id !== 'string')
    throw new Error('Default User ID is not a string')

  if ('name' in token && token.id && typeof token.name !== 'string')
    throw new Error('Default User Name is not a string')

  if ('email' in token && typeof token.email !== 'string')
    throw new Error('Default User Email is not a string')

  if ('image' in token && typeof token.image !== 'string')
    throw new Error('Default User Image is not a string')

  return token as DefaultUser
}

export const defaultToToken = <
  P extends Providers,
  T = DefaultT<P>
>
  (
    data: Awaited<ReturnType<P[keyof P]["authenticate"]>>["data"]
  ): T => {
  if (defaultUser in data == false)
    throw new Error('Default User is missing in Provider Authenticate Data Return')
  if (typeof data[defaultUser] !== 'object')
    throw new Error('Default User is not an object or is missing')
  if ('id' in data[defaultUser] == false)
    throw new Error('Default User ID needs to be present if Default User is present in Provider Authenticate Data Return')
  if ('name' in data[defaultUser] == true && typeof data[defaultUser].name !== 'string')
    throw new Error('Default User Name needs to be a string if Default User is present in Provider Authenticate Data Return')
  if ('email' in data[defaultUser] == true && typeof data[defaultUser].email !== 'string')
    throw new Error('Default User Email needs to be a string if Default User is present in Provider Authenticate Data Return')
  if ('image' in data[defaultUser] == true && typeof data[defaultUser].image !== 'string')
    throw new Error('Default User Image needs to be a string if Default User is present in Provider Authenticate Data Return')

  return data[defaultUser] as T
}


export function defaultToSession<T, S>(data: Awaited<T>) {
  return data as S
}