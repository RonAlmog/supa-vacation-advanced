import { getSession } from "next-auth/react";
import { prisma } from "../../../src/prisma";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  // retrieve the authenticated user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { listedHomes: true },
  });

  const { id } = req.query;
  console.log("query", id);

  if (!user.listedHomes.find((home) => home.id === id)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "PATCH") {
    try {
      const home = await prisma.home.update({
        where: { id },
        data: req.body,
      });
      res.status(200).json(home);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["PATCH"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
