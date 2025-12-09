import { redirect } from "next/navigation";
import { listAllUsers } from "@/lib/supabase/admin";
import { getUserWithRole } from "@/lib/supabase/user";
import UserList from "./UserList";

export default async function AdminUsersPage() {
  // 1. Secure the page: only admins can see it
  const currentUser = await getUserWithRole();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard"); // Redirect non-admins
  }
  // 2. Fetch all users from the database
  const users = await listAllUsers();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-600">View and manage users in the system.</p>
        </div>
        <UserList users={users} currentUser={currentUser} />
      </div>
    </div>
  );

}