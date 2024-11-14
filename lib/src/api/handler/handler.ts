import { isRedirectError } from "next/dist/client/components/redirect";
import { getRouteHandlerContext, RouteHandlerContext } from "./context";
import { AuthContext } from "../../init";
import { signInCallbackFlow, signInFlow, SignInParams, validateSignInParameters } from "../sign-in";
import { createCSRFFlow } from "../csrf";
import { getSessionFlow } from "../get-session";
import { signOutFlow } from "../sign-out";
import { InvalidConfigError, InvalidParameterError } from "../../core/modules/error";

// Main function to export request handlers
export function getNextHandlerFunctions(authContext: AuthContext) {

  type C = RouteHandlerContext

  // Handles errors
  function handleError(error: unknown) {
    if (isRedirectError(error)) throw error
    console.error(error)
    if (error instanceof InvalidParameterError) return Response.json({ error: 'Invalid Request' }, { status: 400 })
    if (error instanceof SyntaxError) return Response.json({ error: 'Invalid Request' }, { status: 400 })
    if (error instanceof InvalidConfigError) return Response.json({ error: 'Invalid Configuration' }, { status: 500 })
    if (error instanceof Error) return Response.json({ error: `[${ error.name }]: ${ error.message }` }, { status: 500 })
    return Response.json({ error }, { status: 500 })
  }

  // Main request handler, delegating based on HTTP method
  async function handler(request: Request) {
    try {
      const ctx = getRouteHandlerContext(authContext, request)
      return await handleRequest(ctx)
    } catch (error) { return handleError(error) }
  }

  // Handles the request based on the HTTP method
  async function handleRequest($: C) {
    if ($.method === 'GET') return await handleGet($)
    if ($.method === 'POST') return await handlePost($)
    return $.methodNotAllowed($.method)
  }

  // Handles GET requests
  async function handleGet($: C) {
    if ($.route === "callback")
      return Response.json(await signInCallbackFlow($))
    if ($.route === "csrf")
      return Response.json(await createCSRFFlow($))
    if ($.route === "session")
      return Response.json(await getSessionFlow($))
    return $.defaultResponse();
  }

  // Handles POST requests
  async function handlePost($: C) {
    if ($.route === "signIn")
      return Response.json(await handleSignInFlow($))
    if ($.route === "signOut")
      return Response.json(await signOutFlow($))
    return $.defaultResponse();
  }

  // Handles the sign in flow
  async function handleSignInFlow($: C) {
    const body = await $.request.json() as any
    const params = validateSignInParameters(authContext, [$.segments[1], body.param0, body.param1])
    return await signInFlow(
      $.segments[1] as any,
      params.credentials,
      params.options,
      $,
    )
  }

  return handler

}