const benefits = [
  {
    icon: "👁",
    title: "Видимость бренда",
    desc: "Логотип на сайте, плакатах и экране сцены. Вас видят до, во время и после события",
  },
  {
    icon: "🎙",
    title: "Голос со сцены",
    desc: "Ведущий называет ваш бренд перед полным залом. Это не реклама — это рекомендация",
  },
  {
    icon: "🤝",
    title: "Прямой контакт",
    desc: "250+ ЛПР в одном зале. Без холодных звонков, без таргета — живое общение",
  },
  {
    icon: "📦",
    title: "В руки каждому",
    desc: "Ваш вкладыш в промо-пакете — спецпредложение лично каждому участнику",
  },
  {
    icon: "💬",
    title: "Доступ к чату",
    desc: "Упоминание в закрытом ТГ-канале участников. Аудитория остаётся с вами после события",
  },
  {
    icon: "📸",
    title: "Готовый контент",
    desc: "Фото и видео с вашим брендом — материал для соцсетей на недели вперёд",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="content-section relative z-10 py-24 md:py-32 border-t border-border/30">
      <div className="container">
        <div className="mb-16">
          <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest mb-6">
            Что вы получаете как партнёр
          </p>
          <h2 className="font-sentient text-4xl md:text-5xl leading-tight max-w-xl">
            Каждый инструмент — прямой контакт с{" "}
            <i className="font-light">вашей аудиторией</i>
          </h2>
          <p className="font-mono text-sm text-foreground/50 mt-6 max-w-md">
            Искусственный интеллект. Живые бизнесы. Реальные кейсы прямо на сцене — без скриптов и постановки.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/20">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-background p-8 hover:bg-white/5 transition-colors duration-300 group"
            >
              <div className="text-3xl mb-5">{b.icon}</div>
              <h3 className="font-sentient text-xl text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                {b.title}
              </h3>
              <p className="font-mono text-sm text-foreground/50 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}