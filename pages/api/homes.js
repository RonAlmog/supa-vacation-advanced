import { PrismaClient } from "@prisma/client";
import { getSession } from "next-auth/react";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  if (req.method === "POST") {
    try {
      const { image, title, description, price, guests, beds, baths } =
        req.body;

      // find the user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const home = await prisma.home.create({
        data: {
          image,
          title,
          description,
          price,
          guests,
          beds,
          baths,
          ownerId: user.id,
        },
      });
      res.status(200).json(home);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res
      .status(405)
      .json({ message: `http method ${req.method} is not supported` });
  }
}
