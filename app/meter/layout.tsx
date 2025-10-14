import Toolbar from "@/components/Toolbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toolbar />
      
      <main>{children}</main>
    </>
  );
}