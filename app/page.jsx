import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import Products from "@/components/Products";
import OurFarm from "@/components/OurFarm";
import WhyChooseUs from "@/components/WhyChooseUs";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <TopBar />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <About />
        <Products />
        <OurFarm/>
        <WhyChooseUs />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
