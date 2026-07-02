"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@autoking/ui";
import styles from "./hero.module.css";

type Msg = { dir: "in" | "out"; text: string; time: string };

export function WhatsAppMock() {
  const t = useTranslations("Hero");
  const chat = t.raw("chat") as Msg[];
  const bodyRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<boolean[]>(() => chat.map(() => false));
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    let timers: ReturnType<typeof setTimeout>[] = [];
    let loop: ReturnType<typeof setInterval> | undefined;

    const play = () => {
      timers.forEach(clearTimeout);
      timers = [];
      setShown(chat.map(() => false));
      setTyping(false);
      let time = 600;
      chat.forEach((msg, i) => {
        // El agente "escribe" antes de responder
        if (msg.dir === "out") {
          const on = time;
          timers.push(setTimeout(() => setTyping(true), on));
          time += 1000;
          timers.push(setTimeout(() => setTyping(false), time));
        }
        const at = time;
        timers.push(setTimeout(() => setShown((p) => p.map((v, j) => (j === i ? true : v))), at));
        time += msg.dir === "in" ? 800 : 900;
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          loop = setInterval(play, 8800);
        } else if (loop) {
          clearInterval(loop);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(body);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      if (loop) clearInterval(loop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  return (
    <div className={styles.phone}>
      <div className={styles.screen}>
        <div className={styles.island} />

        {/* Status bar del sistema */}
        <div className={styles.statusBar}>
          <span>9:41</span>
          <div className={styles.statusIcons}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="2" y="14" width="3" height="6" rx="1" />
              <rect x="7" y="10" width="3" height="10" rx="1" />
              <rect x="12" y="6" width="3" height="14" rx="1" />
              <rect x="17" y="3" width="3" height="17" rx="1" opacity="0.45" />
            </svg>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 18a2 2 0 100 4 2 2 0 000-4zM5 12a10 10 0 0114 0l-2 2a7 7 0 00-10 0l-2-2zm3.5 3.5a5 5 0 017 0l-2 2a2.2 2.2 0 00-3 0l-2-2z" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <rect x="2" y="8" width="18" height="8" rx="2.5" />
              <rect x="4" y="10" width="12" height="4" rx="1" fill="currentColor" stroke="none" />
              <rect x="21" y="10.5" width="1.6" height="3" rx="0.8" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>

        {/* Header del chat */}
        <div className={styles.waTop}>
          <span className={styles.back} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/AutoKing-icono-transparente.png" alt="AutoKing" />
            </div>
            <span className={styles.verified} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className={styles.waMeta}>
            <div className={styles.waName}>{t("agentName")}</div>
            <div className={styles.waStatus}>{t("online")}</div>
          </div>
          <div className={styles.waActions} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
        </div>

        {/* Cuerpo del chat */}
        <div className={styles.waBody} ref={bodyRef}>
          {chat.map((msg, i) => {
            if (!shown[i]) return null;
            const isAgent = msg.dir === "out";
            return (
              <div
                key={i}
                className={cn(styles.bubble, styles.bubbleShow, isAgent ? styles.bubbleAgent : styles.bubbleClient)}
              >
                {msg.text}
                <div className={styles.meta}>
                  <span className={styles.time}>{msg.time}</span>
                  {!isAgent && (
                    <svg className={styles.ticks} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 13l4 4L11 9M9 15l1.5 1.5L21 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className={styles.typing} aria-label="escribiendo">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
