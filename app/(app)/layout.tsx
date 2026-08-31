import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/features/sidebar";
import { Header } from "@/components/features/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
