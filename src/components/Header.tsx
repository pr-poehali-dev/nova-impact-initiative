import { MobileMenu } from "./MobileMenu";

export const Header = () => {
  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container">
        <a href="/" className="font-mono text-sm uppercase tracking-widest text-foreground font-bold">
          ИИ ШОУ
        </a>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          {[
            { label: "О событии", href: "#about" },
            { label: "Выгоды", href: "#benefits" },
            { label: "Пакеты", href: "#packages" },
            { label: "Контакты", href: "#cta" },
          ].map((item) => (
            <a
              className="uppercase inline-block font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          className="uppercase max-lg:hidden transition-colors ease-out duration-150 font-mono text-primary hover:text-primary/80"
          href="#packages"
        >
          [Стать партнёром →]
        </a>
        <MobileMenu />
      </header>
    </div>
  );
};