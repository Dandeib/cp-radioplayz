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

        console.time("authorize_total");
  const { username, password } = credentials as {
    username: string;
    password: string;
  };

  console.time("db_user_findFirst");
  const user = await db.user.findFirst({
    where: {
      name: username
    }
  });
  console.timeEnd("db_user_findFirst");

  if (!user) {
    console.timeEnd("authorize_total");
    throw new Error("Benutzername nicht gefunden");
  }

  console.time("bcrypt_compare");
  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );
  console.timeEnd("bcrypt_compare");

  if (!passwordMatch) {
    console.timeEnd("authorize_total");
    throw new Error("Falsches Passwort");
  }

  console.timeEnd("authorize_total");
  return user;
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