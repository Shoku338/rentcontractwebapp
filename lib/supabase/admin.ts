import { createClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";

// Note: These environment variables should be configured in your deployment provider (e.g., Vercel, Netlify)
// and in a .env.local file for local development.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase URL or Service Role Key is missing from environment variables.");
}

// This admin client is for server-side use ONLY.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type UserWithRole = User & { role: string };

export async function listAllUsers(): Promise<UserWithRole[]> {
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    console.error("Error listing users:", usersError.message);
    return [];
  }

  const userIds = users.map((user) => user.id);
  const { data: profiles, error: profilesError } = await supabaseAdmin.from("profiles").select("id, role").in("id", userIds);

  if (profilesError) {
    console.error("Error fetching user profiles:", profilesError.message);
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p.role]));

  return users.map((user) => ({ ...user, role: profileMap.get(user.id) || "user" }));
}