import { AuthUtils } from "../init";

export async function signOutFlow(
  { sessionStore } : AuthUtils
) {
  console.log("⭐️ Sign Out Flow")

  await sessionStore.clear()
}