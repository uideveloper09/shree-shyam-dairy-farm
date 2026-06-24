"use client";

import TopBar from "@/components/TopBar";
import PromoBanner from "@/components/PromoBanner";
import Navbar from "@/components/Navbar";
import AnmasaHero from "@/components/AnmasaHero";
import ProductCarousel from "@/components/ProductCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import WhyAnmasa from "@/components/WhyAnmasa";
import AboutStrip from "@/components/AboutStrip";
import OurFarm from "@/components/OurFarm";
import Testimonials from "@/components/Testimonials";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import LazySection from "@/components/ui/LazySection";
import {
  ProductCarouselSkeleton,
  CategoryGridSkeleton,
  WhySectionSkeleton,
  SplitSectionSkeleton,
  FarmSectionSkeleton,
  TestimonialsSkeleton,
  ContactSkeleton,
} from "@/components/ui/SectionSkeletons";
import { useSiteData } from "@/context/SiteDataContext";

export default function HomePage() {
  const { productSections } = useSiteData();

  return (
    <>
      <PromoBanner />
      <TopBar />
      <Navbar />
      <main>
        <AnmasaHero />
        {productSections.map((section, i) => (
          <LazySection
            key={section.id}
            skeleton={
              <ProductCarouselSkeleton bg={i % 2 === 1 ? "gray" : "white"} />
            }
          >
            <ProductCarousel
              id={section.id === "best-value" ? "products" : section.id}
              label={section.label}
              title={section.title}
              products={section.products}
              viewAllHref={section.viewAllHref}
              bg={i % 2 === 1 ? "gray" : "white"}
            />
          </LazySection>
        ))}
        <LazySection skeleton={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </LazySection>
        <LazySection skeleton={<WhySectionSkeleton />}>
          <WhyAnmasa />
        </LazySection>
        <LazySection skeleton={<SplitSectionSkeleton bg="cream" />}>
          <AboutStrip />
        </LazySection>
        <LazySection skeleton={<FarmSectionSkeleton />}>
          <OurFarm />
        </LazySection>
        <LazySection skeleton={<TestimonialsSkeleton />}>
          <Testimonials />
        </LazySection>
        <LazySection skeleton={<ContactSkeleton />}>
          <ContactForm />
        </LazySection>
      </main>
      <LazySection skeleton={<div className="lazy-shimmer h-96 w-full" aria-hidden />}>
        <Footer />
      </LazySection>
    </>
  );
}
