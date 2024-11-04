export type SharedAuthConfig = {
  secret?: string,
  baseURL?: string,
  apiRoute?: string,
  expiry?: number,
}

export const csrfHeaderKey = "X-CSRF-Token"