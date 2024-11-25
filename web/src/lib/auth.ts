import { Google, NuAuth } from "nextjwtauth"

export const auth = NuAuth({
  secret: process.env.AUTH_SECRET!,
  authURL: "http://localhost:3000/api/auth",
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