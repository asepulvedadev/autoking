import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Mi perfil</h1>
      <p className="mt-2 text-[var(--color-muted)]">Tus datos personales.</p>
      <ProfileForm profile={profile} email={user!.email!} />
    </div>
  );
}
