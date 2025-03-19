import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// This is a mock user database - in a real app, you'd use a database
const users = [
  {
    id: "1",
    name: "Demo User",
    email: "user@example.com",
    // This is "password" hashed with bcrypt
    password: "$2a$10$8Pn/nSO8wZ9kuyp9nVy.XOZaJG0XvOKn7a9Wn1t9PFG.X5TE.Ysuy",
  },
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // In a real app, you'd query your database here
        const user = users.find((user) => user.email === credentials.email)

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user = {
          ...session.user,
          id: token.sub ?? "", // Ensure id is always a string
        };
      }
      return session;
    },
  },
  
})

export { handler as GET, handler as POST }

