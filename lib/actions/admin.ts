"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Updates a user's role in the 'profiles' table.
 * This is a Server Action and should only be called from the server or a client component.
 * @param userId The UUID of the user to update.
 * @param newRole The new role to assign ('admin' or 'user').
 */
export async function updateUserRole(userId: string, newRole: "admin" | "user") {
  if (!userId || !newRole) {
    return { error: "User ID and new role are required." };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error.message);
    return { error: "Database error: Could not update user role." };
  }

  revalidatePath("/admin/users"); // Refresh the user list page
  return { success: true };
}

/**
 * Creates a new user in Supabase Auth.
 * The `handle_new_user` trigger you created earlier will automatically create a corresponding profile.
 * @param formData Contains the email and password for the new user.
 */
export async function createNewUser(
  prevState: { error: string } | { success: boolean },
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
