import { Cookie } from "./cookie"
import { Redirect } from "./redirect"
import { JWT } from "./jwt"

export type Context = {
  cookie: Cookie,
  headers?: Headers,
  redirect: Redirect,
  jwt: JWT,
  request?: Request,
  searchParams?: URLSearchParams,
  currentUrl?: URL,
}