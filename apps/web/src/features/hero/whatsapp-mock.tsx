"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@autoking/ui";
import styles from "./hero.module.css";

type Msg = { dir: "in" | "out"; text: string; time: string };

const APPEAR_AT = [600, 1500, 2700, 3600];
const LOOP_MS = 8000;

export function WhatsAppMock() {
  const t = useTranslations("Hero");
  const chat = t.raw("chat") as Msg[];
  const bodyRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<boolean[]>(() => chat.map(() => false));

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    let timers: ReturnType<typeof setTimeout>[] = [];
    let loop: ReturnType<typeof setInterval> | undefined;

    const play = () => {
      setShown(chat.map(() => false));
      timers.forEach(clearTimeout);
      timers = chat.map((_, i) =>
        setTimeout(() => setShown((prev) => prev.map((v, j) => (j === i ? true : v))), APPEAR_AT[i]),
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          loop = setInterval(play, LOOP_MS);
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

  return (
    <div className={styles.phone}>
      <div className={styles.screen}>
        <div className={styles.waTop}>
          <div className={styles.avatar}>
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M10 17l6 6 8-11 8 11 6-6-3 19H13l-3-19z" fill="#fff" />
            </svg>
          </div>
          <div>
            <div className={styles.waName}>{t("agentName")}</div>
            <div className={styles.waStatus}>{t("online")}</div>
          </div>
        </div>

        <div className={styles.waBody} ref={bodyRef}>
          {chat.map((msg, i) => (
            <div
              key={i}
              className={cn(
                styles.bubble,
                msg.dir === "in" ? styles.bubbleIn : styles.bubbleOut,
                shown[i] && styles.bubbleShow,
              )}
            >
              {msg.text}
              <span className={styles.time}>{msg.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
