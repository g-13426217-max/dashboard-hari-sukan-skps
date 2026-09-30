import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdmin } from "@/lib/admin-auth";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, allowed } = await requireAdmin("/admin");

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--stadium)] px-4">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
            Ruang admin dilindungi
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Akaun <strong>{user.email}</strong> tidak mempunyai kebenaran untuk
            mengubah data hari sukan.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white hover:bg-cyan-700"
            >
              Kembali ke dashboard
            </Link>
            <a
              href={chatGPTSignOutPath("/admin")}
              target="_top"
              className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              Tukar akaun
            </a>
          </div>
        </section>
      </main>
    );
  }

  const data = await getDashboardData();
  return <AdminDashboard initialData={data} adminName={user.displayName} />;
}
