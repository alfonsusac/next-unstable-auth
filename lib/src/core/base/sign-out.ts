import { DefaultT } from "../modules/config";
import { Context } from "../modules/context";
import { Providers } from "../modules/providers";
import { SessionStore } from "../modules/session";

export async function signOut<
  P extends Providers,
  T = DefaultT<P>,
>(
  $: {
    sessionStore: SessionStore<P, T>
    context: Context,
  }
) {
  await $.sessionStore.clear(
    $.context.cookie,
  )
}