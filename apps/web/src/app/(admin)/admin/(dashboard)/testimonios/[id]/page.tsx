import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonioForm, type Testimonio } from "../testimonio-form";
import { updateTestimonio } from "../actions";
import { DeleteTestimonioButton } from "./delete-button";

export default async function EditTestimonioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("testimonios").select("*").eq("id", id).single();
  if (!data) notFound();
  const testimonio = data as Testimonio;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/testimonios" className="text-sm text-[var(--color-muted)] hover:text-white">← Testimonios</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Editar testimonio</h1>

      <TestimonioForm testimonio={testimonio} action={updateTestimonio} />

      <div className="mt-10 border-t border-[var(--line)] pt-6">
        <p className="mb-3 text-sm text-[var(--color-faint)]">Zona peligrosa</p>
        <DeleteTestimonioButton id={testimonio.id} name={testimonio.author_name} />
      </div>
    </div>
  );
}
