import Link from "next/link";
import { ClienteForm } from "../cliente-form";
import { createCliente } from "../actions";

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/clientes" className="text-sm text-[var(--color-muted)] hover:text-white">← Clientes</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Nuevo cliente</h1>
      <ClienteForm action={createCliente} />
    </div>
  );
}
