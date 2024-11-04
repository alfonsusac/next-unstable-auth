import { AuthUtils } from "../init";

export async function signOutFlow(
  { sessionStore } : AuthUtils
) {
  await sessionStore.clear()
}