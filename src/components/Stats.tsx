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
              className={`py-8 sm:py-10 px-4 sm:px-6 text-center flex flex-col items-center justify-center border-border/30
                ${i % 2 === 0 ? "border-r" : ""}
                ${i < 2 ? "border-b md:border-b-0" : ""}
                md:border-r md:last:border-r-0
              `}
            >
              <span className="font-sentient text-3xl sm:text-4xl md:text-5xl text-primary">
                {stat.value}
              </span>
              <span className="font-mono text-[10px] sm:text-xs uppercase text-foreground/50 mt-2 tracking-wider text-balance text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
