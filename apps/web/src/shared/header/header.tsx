"use client";

import { useEffect, useState } from "react";
import { Logo, buttonVariants, cn } from "@autoking/ui";
import { NAV_LINKS, waHref } from "@/lib/site";
import styles from "./header.module.css";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn(styles.header, scrolled && styles.scrolled)}>
      <div className={cn("container", styles.nav)}>
        <a href="#hero" aria-label="AutoKing — inicio">
          <Logo />
        </a>

        <nav className={cn(styles.links, open && styles.linksOpen)}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navlink} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a
            href={waHref()}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "primary" })}
            onClick={() => setOpen(false)}
          >
            Agenda una demo
          </a>
        </nav>

        <button
          className={styles.toggle}
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
