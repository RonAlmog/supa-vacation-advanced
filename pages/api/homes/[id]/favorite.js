import { prisma } from "../../../../src/prisma";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  // check if authenticated
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  // retrieve the authenticated user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { favoriteHomes: true },
  });

  const { id } = req.query; // homeId
  if (req.method === "GET") {
    try {
      const favHomes = await prisma.favorite.findMany({
        where: { user: user.id },
      });
      res.status(200).json(favHomes);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  // add home to favorites
  else if (req.method === "POST") {
    try {
      const fav = await prisma.favorite.create({
        user: user.id,
        home: id,
      });
      res.status(200).json(fav);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  } else if (req.method === "DELETE") {
    try {
      const fav = await prisma.favorite.delete({
        user: user.id,
        home: id,
      });
      res.status(200).json(fav);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }

  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["POST", "DELETE"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
