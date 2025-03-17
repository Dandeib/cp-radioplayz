import NextAuth from "next-auth"
import { db } from "./lib/db"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {

        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        const user = await db.user.findFirst({
          where: {
            name: username
          }
        })

        if (!user) {
          throw new Error("Benutzername nicht gefunden")
        }

        const passwordMatch = await bcrypt.compare(
          password,
          user.password
        )

        if (!passwordMatch) {
          throw new Error("Falsches Passwort")
        }

        return user
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})