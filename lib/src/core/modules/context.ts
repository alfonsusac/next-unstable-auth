import { SearchParams } from "next/dist/server/request/search-params"
import { Cookie } from "./cookie"
import { Redirect } from "./redirect"
import { JWT } from "./jwt"

export type Context = {
  jwt: JWT,
  cookie: Cookie,
  redirect: Redirect,
  headers?: Headers,
  request?: Request,
  searchParams?: SearchParams,
  currentUrl?: URL,
}