import { redirect } from "next/navigation";
import { Logo } from "@autoking/ui";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <aside className="hidden w-64 flex-col border-r border-[var(--line)] bg-[var(--color-bg-2)] p-5 md:flex">
        <div className="mb-8 px-2">
          <Logo height={28} />
        </div>
        <AdminNav />
        <div className="mt-auto rounded-xl border border-[var(--line)] bg-[var(--color-surface)] p-3">
          <div className="truncate text-sm font-medium text-white">{profile?.full_name || "Admin"}</div>
          <div className="truncate text-xs text-[var(--color-faint)]">{user.email}</div>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6 sm:p-10">{children}</main>
    </div>
  );
}
