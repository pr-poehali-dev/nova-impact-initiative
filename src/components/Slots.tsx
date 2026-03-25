export function Slots() {
  return (
    <>
      <section className="relative z-10 border-t border-border/30 py-6 sm:py-8">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10">
            <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest">
              Свободные слоты
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="font-mono text-sm text-foreground/70">
                Генеральный партнёр —{" "}
                <span className="text-primary font-semibold">1</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-foreground/30 shrink-0" />
              <span className="font-mono text-sm text-foreground/70">
                Партнёр Стандарт —{" "}
                <span className="text-foreground font-semibold">7</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border/30 py-10 sm:py-14 bg-black">
        <div className="container max-w-3xl mx-auto px-4">
          <p className="font-mono text-xs uppercase text-primary tracking-widest mb-4">
            Бонус генеральному партнёру
          </p>
          <h3 className="font-sentient text-2xl sm:text-3xl md:text-4xl leading-tight mb-4 sm:mb-6">
            Сергей Черников проведёт вам{" "}
            <i className="font-light">2-часовую стратегическую сессию</i> по внедрению ИИ в ваш бизнес.
          </h3>
          <p className="font-mono text-sm text-foreground/60 leading-relaxed">
            Сергей — эксперт по ИИ с многолетним опытом. Работал с{" "}
            <span className="text-foreground/90">Дальприбором, Аэропортом Владивосток, Лоджистик Форс, ЭКОцентр, Марин Трейд</span>…
          </p>
        </div>
      </section>
    </>
  );
}