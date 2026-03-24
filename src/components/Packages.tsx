import { Button } from "@/components/ui/button";

const packages = [
  {
    badge: "👑 VIP · Эксклюзив",
    title: "Генеральный партнёр",
    desc: "Ваш бренд звучит со сцены. Весь зал — ваша аудитория.",
    price: "100 000 ₽",
    period: "единоразовый платёж",
    highlight: true,
    urgency: "🔴 Всего 1 место. Когда занято — занято навсегда.",
    cta: "Занять место",
    href: "#cta",
    features: [
      "20 входных билетов на мероприятие",
      "Упоминания ведущим в течение всего шоу",
      "Ролл-апы у сцены — там, куда смотрят все",
      "Центральное место на главном плакате",
      "Промо в чате участников после события",
      "Вкладыш в промо-пакет со спецпредложением",
      "Размещение на сайте конференции",
    ],
  },
  {
    badge: "⭐ Популярный",
    title: "Пакет Standard",
    desc: "Максимум контакта с аудиторией за разумный бюджет.",
    price: "25 000 ₽",
    period: "единоразовый платёж",
    highlight: false,
    urgency: "⏰ После 1 апреля стоимость вырастет",
    cta: "Стать партнёром",
    href: "#cta",
    features: [
      "5 входных билетов на мероприятие",
      "Вкладыш в промо-пакет каждому участнику",
      "Ролл-апы в зоне мероприятия",
      "Логотип на общем рекламном плакате",
      "Упоминание в ТГ-канале участников",
      "Размещение на сайте конференции",
    ],
  },
  {
    badge: "🔄 Бартер",
    title: "Информационный партнёр",
    desc: "Без денег. Только взаимная выгода и присутствие бренда.",
    price: "БАРТЕР",
    period: "охват или услуги — мы вам видимость",
    highlight: false,
    urgency: "💡 Печать, кейтеринг, техника, дизайн, фото/видео, реклама в СМИ",
    cta: "Обсудить бартер",
    href: "#cta",
    features: [
      "Размещение на сайте конференции",
      "Логотип на общем рекламном плакате",
      "Вкладыш в промо-пакет участникам",
      "Массовый охват вашей аудитории",
      "Или услуги для проведения события",
    ],
  },
];

export function Packages() {
  return (
    <section id="packages" className="content-section relative z-10 py-16 sm:py-24 md:py-32 border-t border-border/30">
      <div className="container">
        <div className="mb-10 sm:mb-16">
          <p className="font-mono text-xs uppercase text-foreground/40 tracking-widest mb-4 sm:mb-6">
            Пакеты сотрудничества
          </p>
          <h2 className="font-sentient text-3xl sm:text-4xl md:text-5xl leading-tight">
            Выберите свой формат
          </h2>
          <p className="font-mono text-sm text-foreground/50 mt-3 sm:mt-4">
            Три варианта участия — под любые цели и бюджет.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className={`border flex flex-col p-6 sm:p-8 transition-colors duration-300 ${
                pkg.highlight
                  ? "border-primary/60 bg-primary/5"
                  : "border-border/30 hover:border-border/60"
              }`}
            >
              <div className="mb-5 sm:mb-6">
                <p className="font-mono text-xs text-foreground/50 mb-2 sm:mb-3">{pkg.badge}</p>
                <h3 className="font-sentient text-xl sm:text-2xl text-foreground mb-2">{pkg.title}</h3>
                <p className="font-mono text-xs sm:text-sm text-foreground/50 leading-relaxed">{pkg.desc}</p>
              </div>

              <div className="border-t border-border/20 pt-5 sm:pt-6 mb-5 sm:mb-6">
                <div className={`font-sentient text-2xl sm:text-3xl ${pkg.highlight ? "text-primary" : "text-foreground"}`}>
                  {pkg.price}
                </div>
                <div className="font-mono text-xs text-foreground/40 mt-1">{pkg.period}</div>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                {pkg.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 sm:gap-3">
                    <span className="text-primary mt-0.5 text-sm shrink-0">✓</span>
                    <span className="font-mono text-xs text-foreground/70 leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-5 sm:mb-6">
                <p className="font-mono text-xs text-foreground/40 leading-relaxed">{pkg.urgency}</p>
              </div>

              <a href={pkg.href} className="contents">
                <Button
                  variant={pkg.highlight ? "default" : "outline"}
                  className="w-full"
                >
                  [{pkg.cta} →]
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
