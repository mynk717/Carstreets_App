// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string;
    subdomain?: string;
    dealerId?: string;
    role?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subdomain?: string;
      dealerId?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    subdomain?: string;
    dealerId?: string;
    role?: string;
  }
}

// Admin users (hardcoded for now)
const adminUsers = [
  {
    id: "admin-1",
    name: "Mayank",
    email: process.env.ADMIN_EMAIL || "shukla.mayank247@gmail.com",
    passwordHash: process.env.ADMIN_PASSWORD_HASH || "$2a$12$y0WMrBQKYj3KliIFIRyT1OmwmSNLY3YapBvKgl4CZGzWs6AZVFILG",
    role: "admin",
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        const email = credentials.email.toLowerCase();

        // 1. Check if it's an admin user
        const adminUser = adminUsers.find(u => u.email === email);
        
        if (adminUser) {
          const isValid = await compare(credentials.password, adminUser.passwordHash);
          
          if (!isValid) {
            console.log('❌ Invalid admin password');
            return null;
          }

          console.log('✅ Admin login successful!');
          return {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: "admin",
          };
        }

        // 2. Check if it's a dealer user
        const dealer = await prisma.dealer.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            subdomain: true,
          },
        });

        if (!dealer) {
          console.log('❌ User not found:', email);
          return null;
        }

        // For dealers, you might want to implement password hashing
        // For now, we'll just authenticate them if they exist
        // TODO: Add password field to Dealer model and implement proper hashing
        console.log('✅ Dealer login successful!');
        
        return {
          id: dealer.id,
          name: dealer.name || "Dealer",
          email: dealer.email,
          subdomain: dealer.subdomain,
          dealerId: dealer.id,
          role: "dealer",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subdomain = user.subdomain;
        token.dealerId = user.dealerId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.subdomain = token.subdomain as string | undefined;
        session.user.dealerId = token.dealerId as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
