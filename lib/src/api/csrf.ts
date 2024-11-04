import { headers } from "next/headers";
import { OneTimeCookieStore } from "../util/cookie";
import { InvalidParameterError } from "../util/error";

export async function checkCSRFFlow($: { csrfStore: OneTimeCookieStore }) {
  const header = await headers()
  const csrfHeader = header.get('x-csrf-token')
  if (await $.csrfStore.verify(csrfHeader)) throw new CSRFError()
  return await createCSRFFlow($)
}


export async function createCSRFFlow($: { csrfStore: OneTimeCookieStore }) {
  const csrf = crypto.randomUUID()
  await $.csrfStore.set(csrf)
  return csrf
}


export class CSRFError extends InvalidParameterError {
  constructor() {
    super('CSRF Token is invalid')
  }
}