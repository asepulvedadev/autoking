import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm, type Cliente } from "../cliente-form";
import { updateCliente } from "../actions";
import { DeleteClienteButton } from "./delete-button";

export default async function EditClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).single();
  if (!data) notFound();
  const cliente = data as Cliente;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/clientes" className="text-sm text-[var(--color-muted)] hover:text-white">← Clientes</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">{cliente.business_name}</h1>

      <ClienteForm cliente={cliente} action={updateCliente} />

      <div className="mt-10 border-t border-[var(--line)] pt-6">
        <p className="mb-3 text-sm text-[var(--color-faint)]">Zona peligrosa</p>
        <DeleteClienteButton id={cliente.id} name={cliente.business_name} />
      </div>
    </div>
  );
}
