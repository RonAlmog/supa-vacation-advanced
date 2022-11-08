import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import nodemailer from "nodemailer";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../src/prisma";
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
// for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: false,
});
const emailsDir = path.resolve(process.cwd(), "emails");

const sendVerificationRequest = ({ identifier, url }) => {
  const emailFile = readFileSync(path.join(emailsDir, "confirm-email.html"), {
    encoding: "utf8",
  });

  const emailTemplate = Handlebars.compile(emailFile);
  transporter.sendMail({
    from: `"✨ SupaVacation" ${process.env.EMAIL_SERVER_FROM}`,
    to: identifier,
    subject: "Your sign-in link for SupaVacation",
    html: emailTemplate({
      base_url: process.env.NEXTAUTH_URL,
      signin_url: url,
      email: identifier,
    }),
  });
};

const sendWelcomEmail = async ({ user }) => {
  const { email } = user;
  console.log("new email:", email);
  try {
    const emailFile = readFileSync(path.join(emailsDir, "welcome.html"), {
      encoding: "utf8",
    });

    const emailTemplate = Handlebars.compile(emailFile);
    await transporter.sendMail({
      from: `"✨ SupaVacation" ${process.env.EMAIL_SERVER_FROM}`,
      to: email,
      subject: "Welcom to SupaVacation! 😍",
      html: emailTemplate({
        base_url: process.env.NEXTAUTH_URL,
        support_email: "ron8132@gmail.com",
      }),
    });
  } catch (error) {
    console.log(`Unable to send welcome email to user (${email})`);
  }
};

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    EmailProvider({
      // these are commented since we use our own method for sending email.
      // the function sendVerificationRequest will use 'transporter' that uses the server values.
      //   server: {
      //     host: process.env.EMAIL_SERVER_HOST,
      //     port: process.env.EMAIL_SERVER_PORT,
      //     auth: {
      //       user: process.env.EMAIL_SERVER_USER,
      //       pass: process.env.EMAIL_SERVER_PASSWORD,
      //     },
      //   },
      //   from: process.env.EMAIL_SERVER_FROM,
      //
      maxAge: 10 * 60, // Magic links are valid for 10 min only
      sendVerificationRequest,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
    verifyRequest: "/",
  },
  jwt: {
    // A secret to use for key generation (you should set this explicitly)
    secret: process.env.JWT_SECRET,
  },
  events: {
    createUser: sendWelcomEmail,
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      // console.log("token:", token);
      // console.log("user:", user);
      // Send properties to the client, like an access_token and user id from a provider.
      // session.accessToken = token.accessToken;
      session.user.id = user.id;

      return session;
    },
  },
});
