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
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
            <a
              href="https://t.me/ChernikovGPT"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 mx-auto sm:mx-0"
            >
              <img
                src="https://cdn.poehali.dev/files/de2da251-42c4-4b13-8f0d-359cf12eab07.png"
                alt="Сергей Черников"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border border-border/30 hover:border-primary/60 transition-colors duration-300"
              />
            </a>
            <div>
              <p className="font-mono text-xs uppercase text-primary tracking-widest mb-3">
                Бонус генеральному партнёру
              </p>
              <h3 className="font-sentient text-2xl sm:text-3xl md:text-4xl leading-tight mb-3 sm:mb-5">
                Сергей Черников проведёт вам{" "}
                <i className="font-light">2-часовую стратегическую сессию</i> по внедрению ИИ в ваш бизнес.
              </h3>
              <p className="font-mono text-sm text-foreground/60 leading-relaxed">
                Сергей — эксперт по ИИ с многолетним опытом. Работал с{" "}
                <span className="text-foreground/90">Дальприбором, Аэропортом Владивосток, Лоджистик Форс, ЭКОцентр, Марин Трейд</span>…
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}