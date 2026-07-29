"use client";

import { useRef, useState } from "react";
import { cn } from "@autoking/ui";

/**
 * Zona de arrastrar-y-soltar que alimenta un <input type="file"> real.
 *
 * Por qué así y no un uploader "moderno" con estado propio: el valor de un
 * input file NO se puede setear por código salvo con un DataTransfer. Al
 * escribir ahí los archivos soltados, el formulario sigue siendo un form común
 * y la server action lo recibe sin nada especial. Menos piezas, menos que se
 * rompa.
 */
export function ZonaSubida({
  name = "file",
  accept = "image/*,application/pdf",
  maxMB = 8,
  multiple = false,
  ayuda,
}: {
  name?: string;
  accept?: string;
  maxMB?: number;
  multiple?: boolean;
  ayuda?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  function aceptar(lista: FileList | null) {
    if (!lista?.length) return;
    const files = Array.from(lista);
    const grande = files.find((f) => f.size > maxMB * 1024 * 1024);
    if (grande) {
      setError(`"${grande.name}" pesa más de ${maxMB} MB.`);
      return;
    }
    setError(null);
    setArchivos(files);
    setPreviews(files.filter((f) => f.type.startsWith("image/")).map((f) => URL.createObjectURL(f)));
  }

  function soltar(e: React.DragEvent) {
    e.preventDefault();
    setEncima(false);
    const dt = new DataTransfer();
    for (const f of Array.from(e.dataTransfer.files)) dt.items.add(f);
    if (inputRef.current) inputRef.current.files = dt.files; // ← el form lo recibe igual
    aceptar(dt.files);
  }

  function limpiar() {
    if (inputRef.current) inputRef.current.value = "";
    setArchivos([]);
    setPreviews([]);
    setError(null);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltar}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center transition-colors",
          encima
            ? "border-blue-bright bg-blue/[0.08]"
            : archivos.length
              ? "border-[rgb(43_212_123_/_0.4)] bg-[rgb(43_212_123_/_0.04)]"
              : "border-[var(--line-strong)] bg-[var(--color-bg-2)] hover:border-blue-bright/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={(e) => aceptar(e.target.files)}
          className="hidden"
        />

        {archivos.length === 0 ? (
          <>
            <div className="text-3xl">📎</div>
            <p className="mt-2 font-medium text-white">
              Arrastrá {multiple ? "tus archivos" : "tu archivo"} acá
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">
              o hacé click para buscarlo{ayuda ? ` · ${ayuda}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--color-faint)]">Máximo {maxMB} MB</p>
          </>
        ) : (
          <>
            {previews.length > 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-2">
                {previews.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-24 w-24 rounded-lg object-cover" />
                ))}
              </div>
            )}
            <p className="font-medium text-white">
              {archivos.length === 1 ? archivos[0]!.name : `${archivos.length} archivos listos`}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-faint)]">
              {(archivos.reduce((t, f) => t + f.size, 0) / 1024 / 1024).toFixed(1)} MB · click para cambiar
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); limpiar(); }}
              className="mt-2 text-xs text-[var(--color-faint)] underline hover:text-[var(--color-danger)]"
            >
              Quitar
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
