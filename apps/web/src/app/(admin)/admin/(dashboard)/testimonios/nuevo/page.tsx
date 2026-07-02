import Link from "next/link";
import { TestimonioForm } from "../testimonio-form";
import { createTestimonio } from "../actions";

export default function NuevoTestimonioPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/testimonios" className="text-sm text-[var(--color-muted)] hover:text-white">← Testimonios</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Nuevo testimonio</h1>
      <TestimonioForm action={createTestimonio} />
    </div>
  );
}
