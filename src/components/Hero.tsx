import { GL } from "./gl";
import { Pill } from "./Pill";
import { Button } from "./ui/button";
import { useState } from "react";
import { Header } from "./Header";
import { Countdown } from "./Countdown";

export function Hero() {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="flex flex-col min-h-svh justify-center relative z-10">
      <GL hovering={hovering} />
      <Header />

      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 md:pb-20 text-center relative px-4">
        <Pill className="mb-4 sm:mb-5">18 апреля 2026 · Владивосток</Pill>
        <h1 className="text-[clamp(2rem,8vw,4.5rem)] font-sentient leading-tight">
          250 предпринимателей<br />
          увидят ваш бренд<br />
          <i className="font-light">в один день</i>
        </h1>
        <p className="font-mono text-xs sm:text-sm text-foreground/60 text-balance mt-4 sm:mt-6 max-w-[500px] mx-auto">
          Один день. Одна аудитория. Результат, который работает месяцами.
        </p>
        <p className="font-mono text-xs text-primary/80 mt-2 sm:mt-3 max-w-[400px] mx-auto px-4">
          ⚡ Пока вы читаете — одно из мест уже рассматривает ваш конкурент
        </p>

        <Countdown />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
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