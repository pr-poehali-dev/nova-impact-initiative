import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Slots } from "@/components/Slots";
import { About } from "@/components/About";
import { Benefits } from "@/components/Benefits";
import { Packages } from "@/components/Packages";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Index() {
  return (
    <>
      <Hero />
      <Stats />
      <Slots />
      <About />
      <Benefits />
      <Packages />
      <CTA />
      <Footer />
    </>
  );
}