export function Footer() {
  return (
    <footer className="content-section relative z-10 border-t border-border/30 py-8 sm:py-10">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <div>
          <div className="font-mono text-sm uppercase tracking-widest text-foreground font-bold mb-1">
            ИИ ШОУ БЕЗ ШИРМЫ
          </div>
          <div className="font-mono text-xs text-foreground/40">
            18 апреля 2026 · Отель Экватор · Владивосток
          </div>
        </div>
        <div className="font-mono text-xs text-foreground/30">
          © 2026 · Все права защищены
        </div>
      </div>
    </footer>
  );
}
