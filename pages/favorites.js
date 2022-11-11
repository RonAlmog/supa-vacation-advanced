import Layout from "@/components/Layout";
import Grid from "@/components/Grid";
import { prisma } from "../src/prisma";
import { getSession } from "next-auth/react";

const Favorites = ({ homes = [] }) => {
  return (
    <Layout>
      <h1 className="text-xl font-medium text-gray-800">Your Listings</h1>
      <p className="text-gray-500">Manage your home and update your listings</p>
      <div className="mt-8">
        <Grid homes={homes} />
      </div>
    </Layout>
  );
};

export default Favorites;

export async function getServerSideProps(context) {
  // Check if user is authenticated
  const session = await getSession(context);
  // If not, redirect to the homepage
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const homes = await prisma.home.findMany();

  return {
    props: {
      homes: JSON.parse(JSON.stringify(homes)),
    },
  };
}
