import { clerkClient } from "@clerk/nextjs/server";

export const getUser = async (userId: string) => {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    console.log(user);

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
