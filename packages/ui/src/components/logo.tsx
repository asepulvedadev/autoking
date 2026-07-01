import { cn } from "../lib/cn";
import { Crown } from "./crown";

/** Logotipo AutoKing: corona + wordmark. */
export function Logo({ className, crownClassName }: { className?: string; crownClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[11px] font-display text-[23px] font-extrabold tracking-tight", className)}>
      <Crown className={cn("h-[34px] w-[34px] flex-none", crownClassName)} />
      <span>
        Auto<b className="font-extrabold text-blue-bright">King</b>
      </span>
    </span>
  );
}
