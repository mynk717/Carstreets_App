import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

// Extend NextAuth types to include id
declare module "next-auth" {
  interface User {
    id: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

const users = [
  {
    id: "1",
    name: "Mayank",
    email: process.env.ADMIN_EMAIL || "shukla.mayank247@gmail.com",
    passwordHash: process.env.ADMIN_PASSWORD_HASH || "$2a$12$SJLomRQ21HqC8qIO8wT0geT1./1cUmek5ngO3sqbb2bOC5Dkq8hH6", // bcrypt hash for "CarStreets2024!"
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
          placeholder: "mayank@mktgdime.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt:', credentials?.email);
        console.log('🔑 ENV vars loaded:', {
          hasEmail: !!process.env.ADMIN_EMAIL,
          hasHash: !!process.env.ADMIN_PASSWORD_HASH,
          hasSecret: !!process.env.NEXTAUTH_SECRET
        });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }
      
        const user = users.find(
          (user) => user.email === credentials.email.toLowerCase()
        );
        
        if (!user) {
          console.log('❌ User not found for email:', credentials.email);
          console.log('🔍 Available users:', users.map(u => u.email));
          return null;
        }
      
        console.log('✅ User found, verifying password...');
        console.log('🔑 Hash to compare against:', user.passwordHash.substring(0, 20) + '...');
        
        const isValid = await compare(credentials.password, user.passwordHash);
        
        console.log('🔐 Password comparison result:', isValid);
        
        if (!isValid) {
          console.log('❌ Invalid password');
          return null;
        }
      
        console.log('✅ Login successful!');

        return {
          id: user.id,
          name: user.name,
          email: user.email,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
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
