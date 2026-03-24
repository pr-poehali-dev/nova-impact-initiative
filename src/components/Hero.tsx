import { GL } from "./gl";
import { Pill } from "./Pill";
import { Button } from "./ui/button";
import { useState } from "react";
import { Header } from "./Header";
import { Countdown } from "./Countdown";

export function Hero() {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="flex flex-col h-svh justify-between relative z-10">
      <GL hovering={hovering} />
      <Header />

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">18 апреля 2026 · Владивосток</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient leading-tight">
          250 предпринимателей<br />
          увидят ваш бренд<br />
          <i className="font-light">в один день</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[500px] mx-auto">
          Один день. Одна аудитория. Результат, который работает месяцами.
        </p>
        <p className="font-mono text-xs text-primary/80 mt-4 max-w-[400px] mx-auto">
          ⚡ Пока вы читаете — одно из мест уже рассматривает ваш конкурент
        </p>

        <Countdown />

        <div className="flex items-center justify-center gap-4 mt-10 flex-wrap">
          <a className="contents max-sm:hidden" href="#packages">
            <Button
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              [Выбрать пакет]
            </Button>
          </a>
          <a className="contents sm:hidden" href="#packages">
            <Button
              size="sm"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              [Выбрать пакет]
            </Button>
          </a>
          <a
            href="#about"
            className="font-mono text-sm uppercase text-foreground/50 hover:text-foreground/80 transition-colors duration-150"
          >
            Узнать подробнее ↓
          </a>
        </div>
      </div>
    </div>
  );
}