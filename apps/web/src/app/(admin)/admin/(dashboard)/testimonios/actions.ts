"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TestimonioState = { error?: string };

function parse(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    quote: str("quote"),
    author_name: str("author_name"),
    author_role: str("author_role") || null,
    rating: Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5))),
    avatar_url: str("avatar_url") || null,
    published: formData.get("published") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
}

function revalidateAll() {
  revalidatePath("/admin/testimonios");
  revalidatePath("/", "layout"); // landing pública (testimonios)
}

export async function createTestimonio(_prev: TestimonioState, formData: FormData): Promise<TestimonioState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const v = parse(formData);
  if (!v.quote || !v.author_name) return { error: "El testimonio y el nombre son obligatorios." };

  const { error } = await supabase.from("testimonios").insert(v);
  if (error) return { error: error.message };

  revalidateAll();
  redirect("/admin/testimonios");
}

export async function updateTestimonio(_prev: TestimonioState, formData: FormData): Promise<TestimonioState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const id = String(formData.get("id") ?? "");
  const v = parse(formData);
  if (!v.quote || !v.author_name) return { error: "El testimonio y el nombre son obligatorios." };

  const { error } = await supabase.from("testimonios").update(v).eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  redirect("/admin/testimonios");
}

export async function deleteTestimonio(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("testimonios").delete().eq("id", id);
  revalidateAll();
  redirect("/admin/testimonios");
}
