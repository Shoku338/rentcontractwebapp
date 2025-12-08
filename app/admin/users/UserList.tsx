"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { User } from "@supabase/supabase-js";
import { createNewUser, updateUserRole } from "@/lib/actions/admin";

type UserWithRole = User & { role: string };

interface UserListProps {
  users: UserWithRole[];
  currentUser: UserWithRole;
}

type FormState =
  | { error: string; success?: undefined }
  | { success: boolean; error?: undefined };


const initialState: FormState = {
  success: false,
};

export default function UserList({ users, currentUser }: UserListProps) {
  // `useFormState` manages the result of the form action.
  // `formAction` is now the function you pass to the form's `action` prop.
  const [state, formAction] = useActionState(createNewUser, initialState);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
    }
  };

  // Effect to close the form and show an alert on successful user creation
  useEffect(() => {
    if (state.success) {
      alert("User created successfully!");
      setShowCreateForm(false);
    }
  }, [state]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">All Users</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          {showCreateForm ? "Cancel" : "Create New User"}
        </button>
      </div>

      {showCreateForm && (
        <form action={formAction} className="bg-gray-100 p-4 rounded-lg mb-6 space-y-4">
          <h3 className="font-semibold">New User Details</h3>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {/* Display server-side errors */}
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Joined At</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  {user.id !== currentUser.id && ( // Prevent admin from changing their own role
                    user.role === 'admin' ? (
                      <button onClick={() => handleRoleChange(user.id, 'user')} className="font-medium text-red-600 hover:underline">
                        Demote to User
                      </button>
                    ) : (
                      <button onClick={() => handleRoleChange(user.id, 'admin')} className="font-medium text-blue-600 hover:underline">
                        Promote to Admin
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// A helper component to show a pending state on the submit button
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
      {pending ? "Saving..." : "Save User"}
    </button>
  );
}
