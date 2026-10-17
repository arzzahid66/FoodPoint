import { redirect } from "next/navigation";
import { requireUser } from "@/server/guard";

export default async function AdminIndex() {
  const user = await requireUser();
  redirect(user.role === "OWNER" ? "/admin/dashboard" : "/admin/orders");
}
