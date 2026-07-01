import { cn } from "../lib/cn";

/** Rating visual en estrellas doradas. */
export function Stars({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn("inline-flex gap-0.5 text-gold", className)}
      role="img"
      aria-label={`${count} de 5 estrellas`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.6 1.4 6.8L12 17.8 5 20.5l1.4-6.8L1.3 9.1l6.9-.8z" />
        </svg>
      ))}
    </div>
  );
}
