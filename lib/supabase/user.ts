import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getUserWithRole() {
  const cookieStore = await cookies(); // This can be async in some contexts
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Assuming you have a 'profiles' table with a 'role' column
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return { ...user, role: null };
  }

  return { ...user, role: profile?.role || null };
}