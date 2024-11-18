import { Google, NuAuth } from "nextjwtauth"

export const auth = NuAuth({
  secret: process.env.AUTH_SECRET!,
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
  getSession,
} = auth