import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-olive px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-panel)] bg-cream p-8">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">Sri Meenakshi Silk House</p>
        <h1 className="h-display mt-2 text-4xl">Admin</h1>
        <LoginForm />
      </div>
    </main>
  );
}
