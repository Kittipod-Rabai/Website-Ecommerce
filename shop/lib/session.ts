import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}
