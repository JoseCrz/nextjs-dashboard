import { z } from "zod";
import bcrypt from "bcrypt";
import { sql } from "@vercel/postgres";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

import type { User } from "@/app/lib/definitions";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = CredentialsSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await getUser(email);

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});

async function getUser(email: string) {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;

    return user.rows[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}
