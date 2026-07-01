import { cn } from "../lib/cn";

/** Corona-K de marca AutoKing (con degradado azul). */
export function Crown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id="ak-crown-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#4d8bff" />
          <stop offset="1" stopColor="#0a3bb0" />
        </linearGradient>
      </defs>
      <path d="M8 16l7 7 9-13 9 13 7-7-3 23H11L8 16z" fill="url(#ak-crown-grad)" />
      <path d="M14 41h20l-1.4 4H15.4L14 41z" fill="#1e6bff" />
      <circle cx="8" cy="14" r="3" fill="#4d8bff" />
      <circle cx="40" cy="14" r="3" fill="#4d8bff" />
      <circle cx="24" cy="8" r="3.4" fill="#4d8bff" />
    </svg>
  );
}

/** Corona simple rellena — usada como indicador de nivel (planes). */
export function CrownMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("h-[22px] w-[22px] text-blue-bright", className)}>
      <path d="M3 8l4 4 5-7 5 7 4-4-2 12H5L3 8z" />
    </svg>
  );
}
