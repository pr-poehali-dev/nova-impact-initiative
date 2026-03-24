export function Stats() {
  const stats = [
    { value: "250+", label: "Предпринимателей" },
    { value: "6+", label: "Спикеров" },
    { value: "18.04", label: "Дата события" },
    { value: "1", label: "Место генерального партнёра" },
  ];

  return (
    <section className="content-section relative z-10 border-t border-border/30">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="py-10 px-6 border-r border-border/30 last:border-r-0 text-center flex flex-col items-center justify-center even:border-r-0 md:even:border-r"
            >
              <span className="font-sentient text-4xl md:text-5xl text-primary">
                {stat.value}
              </span>
              <span className="font-mono text-xs uppercase text-foreground/50 mt-2 tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}