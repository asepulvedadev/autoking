"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@autoking/ui";
import styles from "./hero.module.css";

type Msg = { dir: "in" | "out"; text: string; time: string };

const CHAT: Msg[] = [
  { dir: "in", text: "Hola, ¿están abiertos? Quiero una cita para mañana 😊", time: "23:47" },
  {
    dir: "out",
    text: "¡Hola! 👋 Claro que sí, con gusto te agendo. Tengo espacio mañana a las 10:00, 1:30 p. m. y 5:00 p. m. ¿Cuál te sirve mejor?",
    time: "23:47",
  },
  { dir: "in", text: "Las 5:00 p. m. perfecto", time: "23:48" },
  {
    dir: "out",
    text: "¡Listo! ✅ Tu cita quedó agendada mañana a las 5:00 p. m. Te enviaré un recordatorio. ¿Me confirmas tu nombre?",
    time: "23:48",
  },
];

const APPEAR_AT = [600, 1500, 2700, 3600];
const LOOP_MS = 8000;

export function WhatsAppMock() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<boolean[]>(() => CHAT.map(() => false));

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    let timers: ReturnType<typeof setTimeout>[] = [];
    let loop: ReturnType<typeof setInterval> | undefined;

    const play = () => {
      setShown(CHAT.map(() => false));
      timers.forEach(clearTimeout);
      timers = CHAT.map((_, i) =>
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
            <div className={styles.waName}>AutoKing · Asistente</div>
            <div className={styles.waStatus}>en línea</div>
          </div>
        </div>

        <div className={styles.waBody} ref={bodyRef}>
          {CHAT.map((msg, i) => (
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
