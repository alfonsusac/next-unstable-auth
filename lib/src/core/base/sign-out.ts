import { AuthContext } from "../init";

export async function signOut(
  $: AuthContext<any, any, any>
) {
  $.sessionStore.clear()
}