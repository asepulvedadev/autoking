"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, buttonVariants, AuroraBackground } from "@autoking/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  const field =
    "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-6">
      <AuroraBackground />
      <div className="relative z-10 w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--line)] bg-[linear-gradient(180deg,var(--color-surface),var(--color-bg-2))] p-8 shadow-[var(--shadow-blue)]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm text-[var(--color-muted)]">Panel de administración</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            autoComplete="email"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={buttonVariants({ variant: "primary", className: "mt-2 w-full disabled:opacity-60" })}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
