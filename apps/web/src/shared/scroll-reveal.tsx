"use client";

import { useEffect } from "react";

/**
 * Activa las animaciones de entrada: agrega `.visible` a cada `.reveal`
 * cuando aparece en viewport. Se monta una sola vez en la página.
 *
 * Robusto: además del IntersectionObserver (para animar al hacer scroll),
 * revela de forma CONFIABLE cualquier `.reveal` que ya esté en pantalla en cada
 * scroll/resize. Así ningún elemento queda trabado invisible (bug del observer
 * que se "tragaba" items, p. ej. tras un salto a un ancla como #faq).
 */
export function ScrollReveal() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const reveal = (el: Element) => el.classList.add("visible");
    const remaining = () =>
      Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.visible)"));

    if (typeof IntersectionObserver === "undefined") {
      remaining().forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    remaining().forEach((el) => observer.observe(el));

    // Red de seguridad: revela lo que ya está visible ahora (getBoundingClientRect
    // es más confiable que el observer para items en pantalla) y re-evalúa en cada
    // scroll/resize. Garantiza que nada visible quede en opacity:0.
    const revealInView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      remaining().forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; revealInView(); });
    };

    revealInView();
    const settle = setTimeout(revealInView, 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      document.documentElement.classList.remove("js");
      observer.disconnect();
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
