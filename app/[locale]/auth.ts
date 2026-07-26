import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { User } from "next-auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

type Role = "USER" | "ADMIN" | "EDITOR";

type SessionSafeUser = User & {
  id: string;
  email: string;
  role?: Role;
  permissions?: string[];
  emailVerified: Date | null;
  image?: string | null;
  name?: string | null;
};

type OAuthProfile = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: Role;
  permissions?: string[];
};

type PrismaUserWithAuth = {
  id: string;
  email: string | null;
  username: string | null;
  image: string | null;
  emailVerified?: Date | null;
  role?: Role | null;
  permissions?: string[] | null;
};

declare module "next-auth" {
  interface Session {
    user: { id: string; role?: Role; permissions?: string[] } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    permissions?: string[];
    name?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    GitHub,
    Google,
    Credentials({
      credentials: {
        emailOrUsername: {},
        password: { type: "password" },
      },
      async authorize(creds) {
        const id = typeof creds?.emailOrUsername === "string" ? creds.emailOrUsername.trim() : "";
        const pw = typeof creds?.password === "string" ? creds.password : "";
        if (!id || !pw) return null;

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: id }, { username: id }] },
        });
        if (!user || !user.password) return null;

        const ok = await verifyPassword(pw, user.password as string);
        if (!ok) return null;

        const sessionUser: SessionSafeUser = {
          id: user.id,
          email: user.email ?? "",
          emailVerified: (user as PrismaUserWithAuth).emailVerified ?? null,
          name: user.username ?? null,
          image: user.image ?? null,
          role: (user as PrismaUserWithAuth).role ?? "USER",
          permissions: (user as PrismaUserWithAuth).permissions ?? [],
        };

        return sessionUser;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account && (account.provider === "github" || account.provider === "google")) {
        const email = user.email;
        if (!email) return false;
        let found = await prisma.user.findUnique({ where: { email } });
        if (!found) {
          const username = (user.name ?? (email.split("@")[0] ?? "user")).toString();
          found = await prisma.user.create({
            data: {
              email,
              username,
              role: "USER",
              permissions: [],
              image: (user as OAuthProfile)?.image ?? undefined,
            },
          });
        }
        // ensure account is linked to user
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: { userId: found.id },
          create: {
            userId: found.id,
            provider: account.provider,
            type: account.type,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token ?? null,
            access_token: account.access_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            // Ensure we only persist string data for session_state
            session_state: typeof account.session_state === "string" ? account.session_state : null,
          },
        });
        const mutableUser = user as SessionSafeUser;
        mutableUser.id = found.id;
        mutableUser.role = (found as PrismaUserWithAuth).role ?? "USER";
        mutableUser.permissions = (found as PrismaUserWithAuth).permissions ?? [];
        // keep name/image in session data for client UI
        mutableUser.name = found.username ?? user.name ?? null;
        mutableUser.image = found.image ?? user.image ?? null;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as SessionSafeUser;
        token.id = authUser.id;
        token.role = authUser.role ?? "USER";
        token.permissions = authUser.permissions ?? [];
        token.name = authUser.name ?? null;
        token.emailVerified = authUser.emailVerified ?? null;
        token.image = authUser.image ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, email: true, image: true, emailVerified: true },
        });

        const sessionUser = (session.user as SessionSafeUser) ?? {
          id: "",
          email: "",
          emailVerified: null,
        };
        session.user = sessionUser;

        sessionUser.id = token.id as string;
        sessionUser.role = token.role ?? "USER";
        sessionUser.permissions = token.permissions ?? [];

        const nameFromDb = dbUser?.username ?? null;
        const fallbackName = token.name ?? session.user?.name ?? dbUser?.email?.split("@")?.[0] ?? null;
        sessionUser.name = nameFromDb ?? fallbackName;
        sessionUser.email = dbUser?.email ?? token.email ?? sessionUser.email ?? "";
        sessionUser.emailVerified = dbUser?.emailVerified ?? token.emailVerified ?? null;
        sessionUser.image = dbUser?.image ?? token.image ?? session.user?.image ?? null;
      }
      return session;
    },
  },
});
