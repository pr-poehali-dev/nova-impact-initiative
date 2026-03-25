export function Slots() {
  return (
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
  );
}
