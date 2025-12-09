import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getUserWithRole() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  return { ...user, role: profile?.role || "user" };
}
