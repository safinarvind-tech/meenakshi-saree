import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { logout } from "@/app/admin/(auth)/login/actions";

export async function AdminUser() {
  const admin = await requireAdmin();
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="truncate text-sm font-medium">{admin.name}</p>
      <p className="truncate text-xs text-paper/60">
        {admin.email} · {admin.role.toLowerCase()}
      </p>
      <form action={logout}>
        <button className="mt-3 flex items-center gap-2 text-sm text-gold-light hover:text-white">
          <LogOut className="size-4" /> Sign out
        </button>
      </form>
    </div>
  );
}
