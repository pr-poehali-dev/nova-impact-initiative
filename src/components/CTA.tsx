import { Button } from "@/components/ui/button";
import { Countdown } from "./Countdown";

export function CTA() {
  return (
    <section id="cta" className="content-section relative z-10 py-16 sm:py-24 md:py-40 border-t border-border/30">
      <div className="container text-center max-w-3xl mx-auto px-4">
        <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest mb-4 sm:mb-6">
          Действуйте сейчас
        </p>
        <h2 className="font-sentient text-3xl sm:text-4xl md:text-6xl leading-tight mb-4 sm:mb-6">
          До события осталось:
        </h2>

        <Countdown />

        <h2 className="font-sentient text-3xl sm:text-4xl md:text-6xl leading-tight mt-6 sm:mt-8 mb-6 sm:mb-8">
          <i className="font-light">Свободных мест — единицы.</i>
        </h2>

        <div className="inline-flex flex-col gap-3 mb-8 sm:mb-10 text-left">
          <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest mb-1">Свободные слоты</p>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-mono text-sm text-foreground/80">Генеральный партнёр — <span className="text-foreground font-semibold">1</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-foreground/40 shrink-0" />
            <span className="font-mono text-sm text-foreground/80">Партнёр Standard — <span className="text-foreground font-semibold">7</span></span>
          </div>
        </div>

        <p className="font-mono text-sm text-foreground/50 leading-relaxed mb-3 sm:mb-4 max-w-lg mx-auto">
          Каждый день ожидания — это день, когда ваш конкурент мог занять ваше место рядом со сценой.
        </p>
        <p className="font-mono text-sm text-primary/80 mb-8 sm:mb-12">
          🔴 Напишите сейчас — медиакит пришлём в течение часа
        </p>

        <a href="https://t.me/DashaChernikova8" target="_blank" rel="noopener noreferrer" className="contents">
          <Button size="lg" className="text-sm sm:text-base w-full sm:w-auto">
            [Написать и получить медиакит →]
          </Button>
        </a>

        <p className="font-mono text-xs text-foreground/30 mt-6 sm:mt-8">
          Это разовая возможность. Следующий шанс — только через год.
        </p>
      </div>
    </section>
  );
}