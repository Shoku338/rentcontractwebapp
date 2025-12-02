import Toolbar from "@/components/Toolbar";

export default function RentbillLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toolbar />
      
      <main>{children}</main>
    </>
  );
}