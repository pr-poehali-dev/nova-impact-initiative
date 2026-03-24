import { GL } from "./gl";
import { Pill } from "./Pill";
import { Button } from "./ui/button";
import { useState } from "react";
import { Header } from "./Header";
import { Countdown } from "./Countdown";

export function Hero() {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="flex flex-col min-h-svh justify-between relative z-10">
      <GL hovering={hovering} />
      <Header />

      <div className="pb-10 sm:pb-16 md:pb-24 mt-auto text-center relative px-4">
        <Pill className="mb-4 sm:mb-6">18 апреля 2026 · Владивосток</Pill>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sentient leading-tight">
          250 предпринимателей<br />
          увидят ваш бренд<br />
          <i className="font-light">в один день</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-5 sm:mt-8 max-w-[500px] mx-auto">
          Один день. Одна аудитория. Результат, который работает месяцами.
        </p>
        <p className="font-mono text-xs text-primary/80 mt-3 sm:mt-4 max-w-[400px] mx-auto px-4">
          ⚡ Пока вы читаете — одно из мест уже рассматривает ваш конкурент
        </p>

        <Countdown />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10">
          <a href="#packages" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
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
