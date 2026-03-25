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

        <div className="grid grid-cols-2 md:grid-cols-4 border border-border/30 rounded-lg overflow-hidden mb-8 sm:mb-10">
          {[
            { value: "250+", label: "Предпринимателей" },
            { value: "6+", label: "Спикеров" },
            { value: "18.04", label: "Дата события" },
            { value: "1", label: "Место генерального партнёра" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`py-6 px-4 flex flex-col items-center justify-center border-border/30
                ${i % 2 === 0 ? "border-r" : ""}
                ${i < 2 ? "border-b md:border-b-0" : ""}
                md:border-r md:last:border-r-0
              `}
            >
              <span className="font-sentient text-2xl sm:text-3xl text-primary">{stat.value}</span>
              <span className="font-mono text-[10px] sm:text-xs uppercase text-foreground/50 mt-1 tracking-wider text-balance text-center">{stat.label}</span>
            </div>
          ))}
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