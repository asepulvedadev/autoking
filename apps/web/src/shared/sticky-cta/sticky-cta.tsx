"use client";

import { useEffect, useState } from "react";
import { buttonVariants, WhatsAppIcon, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";

/** Barra de CTA fija al pie, solo en mobile, que aparece al scrollear.
 *  En desktop se usa el botón flotante de WhatsApp (ver whatsapp-float). */
export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[95] border-t border-[var(--line)] p-3 backdrop-blur-lg transition-transform duration-300 sm:hidden",
        "bg-[rgb(5_7_13_/_0.92)]",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <a
        href={waHref()}
        target="_blank"
        rel="noopener"
        className={buttonVariants({ variant: "primary", className: "w-full" })}
      >
        <WhatsAppIcon /> Agenda tu demo gratis
      </a>
    </div>
  );
}
