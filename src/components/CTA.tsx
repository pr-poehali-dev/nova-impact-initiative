import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="cta" className="relative z-10 py-24 md:py-40 border-t border-border/30">
      <div className="container text-center max-w-3xl mx-auto">
        <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest mb-6">
          Действуйте сейчас
        </p>
        <h2 className="font-sentient text-4xl md:text-6xl leading-tight mb-6">
          До события — 25 дней.<br />
          <i className="font-light">Свободных мест — единицы.</i>
        </h2>
        <p className="font-mono text-sm text-foreground/50 leading-relaxed mb-4 max-w-lg mx-auto">
          Каждый день ожидания — это день, когда ваш конкурент мог занять ваше место рядом со сценой.
        </p>
        <p className="font-mono text-sm text-primary/80 mb-12">
          🔴 Напишите сейчас — медиакит пришлём в течение часа
        </p>

        <a href="https://t.me/" className="contents">
          <Button size="lg" className="text-base">
            [Написать и получить медиакит →]
          </Button>
        </a>

        <p className="font-mono text-xs text-foreground/30 mt-8">
          Это разовая возможность. Следующий шанс — только через год.
        </p>
      </div>
    </section>
  );
}
