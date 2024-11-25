import { Config } from "../../config"
import { csrfHeaderKey } from "../shared"
import { SignInOptions, SignInParams } from "../sign-in"

export type ClientConfig = {
  basePath: `/${ string }`
}

export function createAuthClient<C extends Config>(
  config: ClientConfig
) {

  // ------------------------------------------
  type P = C['providers']
  type S = ReturnType<NonNullable<C['toSession']>>
  const ctx = init(config)
  // ------------------------------------------
  const getSession = async () => {
    const { data: csrf } = await ctx.POST('/csrf')
    const { data } = await ctx.POST('/session', {}, csrf)
    return data
  }
  // ------------------------------------------
  const listeners: ((session: S) => void)[] = []
  const sessionEvent = {
    "add": (cb: (session: S) => void) => listeners.push(cb),
    "remove": (cb: (session: S) => void) => {
      const index = listeners.indexOf(cb)
      if (index !== -1) listeners.splice(index, 1)
    },
    "dispatch": async () => {
      const session = await getSession()
      listeners.forEach(cb => cb(session))
    }
  }
  // ------------------------------------------
  const signIn = async <ID extends string | number>(...params: SignInParams<P, ID>) => {
    const id = params[0] as string | number
    const { data: csrf } = await ctx.POST('/csrf')
    const res = await ctx.POST(`/signIn/${ id }`, { param0: params[1], param1: params[2] }, csrf)
    await sessionEvent.dispatch()
  }
  // ------------------------------------------
  const signOut = async () => {
    const { data: csrf } = await ctx.POST('/csrf')
    await ctx.POST('/signOut', {}, csrf)
    await sessionEvent.dispatch()
  }
  // ------------------------------------------
  return {
    signIn,
    signOut,
    getSession,
    sessionEvent,
    config,
  }
}





type FetchContextReturn = {
  data: any,
  status: number
}


function init(c: ClientConfig) {
  // ------------------------------------------
  const path = c.basePath
  // ------------------------------------------
  const POST = async (
    url: `/${ string }`,
    body?: object,
    csrf?: string
  ) => {
    const res = await fetch(`${ path }${ url }`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [csrfHeaderKey]: csrf || ''
      },
      body: JSON.stringify(body)
    })
    const data = await res.json()

    if (res.status !== 200)
      throw new Error("Fetch Error: " + res.statusText + " - " + data)

    return { data, status: res.status } as FetchContextReturn
  }
  // ------------------------------------------
  const GET = async (
    url: `/${ string }`,
  ) => {
    const res = await fetch(`${ path }${ url }`)
    const data = await res.json()

    if (res.status !== 200)
      throw new Error("Fetch Error: " + res.statusText + " - " + data)

    return { data, status: res.status } as FetchContextReturn
  }
  // ------------------------------------------
  return {
    path,
    POST,
    GET
  }
}