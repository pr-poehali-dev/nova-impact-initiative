import { useState, useEffect } from "react";

function getTimeLeft() {
  const target = new Date("2026-04-18T00:00:00");
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 mt-8 font-mono">
      {[
        { value: time.days, label: "дней" },
        { value: time.hours, label: "часов" },
        { value: time.minutes, label: "минут" },
        { value: time.seconds, label: "секунд" },
      ].map(({ value, label }, i) => (
        <div key={label} className="flex items-start gap-3">
          {i > 0 && (
            <span className="text-2xl text-foreground/30 leading-none mt-1">:</span>
          )}
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums leading-none">
              {pad(value)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-foreground/40 mt-1">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
