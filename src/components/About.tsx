export function About() {
  const details = [
    { icon: "📅", label: "18 апреля 2026", desc: "Дата проведения" },
    { icon: "📍", label: "Отель Экватор", desc: "Место проведения, Владивосток" },
    { icon: "👥", label: "250+ участников", desc: "Предприниматели и ЛПР" },
    { icon: "🎤", label: "6+ спикеров", desc: "Практики и эксперты рынка" },
  ];

  return (
    <section id="about" className="relative z-10 py-24 md:py-32 border-t border-border/30">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest mb-6">
              О мероприятии
            </p>
            <h2 className="font-sentient text-4xl md:text-5xl leading-tight mb-8">
              Это не конференция.<br />
              <i className="font-light">Это живое шоу.</i>
            </h2>
            <p className="font-mono text-sm text-foreground/60 leading-relaxed mb-6">
              «ИИ ШОУ БЕЗ ШИРМЫ» — это событие, где предприниматели прямо на сцене разбирают бизнесы с помощью искусственного интеллекта. Без скучных слайдов, без воды — только живые кейсы и реальный результат.
            </p>
            <p className="font-mono text-sm text-foreground/60 leading-relaxed mb-6">
              В зале — 250+ владельцев бизнеса и топ-менеджеров Владивостока. Люди с бюджетами, которые пришли за инструментами роста. Они мотивированы, открыты к новому и готовы принимать решения.
            </p>
            <p className="font-mono text-sm text-primary/90 leading-relaxed font-medium">
              Именно перед этой аудиторией мы ставим ваш бренд.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {details.map((d, i) => (
              <div
                key={i}
                className="border border-border/30 p-6 hover:border-primary/40 transition-colors duration-300"
              >
                <div className="text-2xl mb-3">{d.icon}</div>
                <div className="font-sentient text-lg text-foreground mb-1">{d.label}</div>
                <div className="font-mono text-xs text-foreground/50">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
