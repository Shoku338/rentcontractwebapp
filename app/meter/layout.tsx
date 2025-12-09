import Toolbar from "@/components/Toolbar";
import { getUserWithRole } from "@/lib/supabase/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithRole();
  return (
    <>
      <Toolbar userRole={user?.role} />
      <main>{children}</main>
    </>
  );
}