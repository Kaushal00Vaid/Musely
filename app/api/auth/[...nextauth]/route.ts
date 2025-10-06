import { prismaClient } from "@/app/lib/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextResponse } from "next/server";

const handler = NextAuth({
  // i want to login with google
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn(params) {
      if (!params.user.email) {
        return false;
      }
      try {
        const existingUser = await prismaClient.user.findUnique({
          where: {
            email: params.user.email,
          },
        });
        if (!existingUser) {
          await prismaClient.user.create({
            data: {
              email: params.user.email,
              provider: "Google",
            },
          });
        }
        // Allow the sign-in
        return true;
      } catch (e) {
        console.log("Error in signin callback", e);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
