import { Google, NextJWTAuth } from "nextjwtauth"

export const auth = NextJWTAuth({
  apiRoute: "/api/auth",
  providers: {
    google: Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enableRefreshToken: true,
    })
  }
})

export const {
  signIn,
  signOut,
  routeHandler,
  config,
  getSession
} = auth