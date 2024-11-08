import { createContext, ReactNode, use, useEffect, useState } from "react";
import { Config } from "../../config";
import { ClientConfig, createAuthClient } from "./browser";

export function createReactAuthClient<C extends Config>(config: ClientConfig) {
  type S = ReturnType<NonNullable<C['toSession']>>
  const client = createAuthClient(config)

  const reactSessionContext = createContext<S | null>(null);

  return {
    "SessionProvider": (props: {
      children: ReactNode,
      session?: S,
    }) => {
      const [session, setSession] = useState<S | null>(
        props.session ?? null
      )

      useEffect(() => {
        
        client.sessionEvent.add(setSession)
        client.sessionEvent.dispatch()

        return () => {
          client.sessionEvent.remove(setSession)
        }
      }, [])

      // TODO - refresh token on tab focus
      // TODO - refresh token on interval
      // TODO - refresh token on session expiry ?

      return (
        <reactSessionContext.Provider value={session}>
          {props.children}
        </reactSessionContext.Provider>
      )
    },
    "useSession": () => {
      const session = use(reactSessionContext)
      if (!session) throw new Error("useSession must be used within a SessionProvider")
      return session
    },

  }
}