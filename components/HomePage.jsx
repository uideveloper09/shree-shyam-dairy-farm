"use client";

import { useEffect, useMemo } from "react";
import TopBar from "@/components/TopBar";
import PromoBanner from "@/components/PromoBanner";
import Navbar from "@/components/Navbar";
import AnmasaHero from "@/components/AnmasaHero";
import ProductCarousel from "@/components/ProductCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import WhyAnmasa from "@/components/WhyAnmasa";
import AboutSection from "@/components/sections/AboutSection";
import { HOME_SECTIONS, buildHomeSectionOrder } from "@/lib/sections";
import { useSectionScroll } from "@/context/SectionScrollContext";
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
  const { registerHomeSectionOrder } = useSectionScroll();

  const sectionOrder = useMemo(
    () => buildHomeSectionOrder(productSections),
    [productSections]
  );

  useEffect(() => {
    registerHomeSectionOrder(sectionOrder);
  }, [sectionOrder, registerHomeSectionOrder]);

  return (
    <div className="site-shell">
      <PromoBanner />
      <TopBar />
      <Navbar />
      <main>
        <AnmasaHero />
        {productSections.map((section, i) => (
          <LazySection
            key={section.id}
            sectionId={section.id === "best-value" ? HOME_SECTIONS.PRODUCTS : section.id}
            skeleton={
              <ProductCarouselSkeleton bg={i % 2 === 1 ? "gray" : "white"} />
            }
          >
            <ProductCarousel
              id={section.id === "best-value" ? HOME_SECTIONS.PRODUCTS : section.id}
              label={section.label}
              title={section.title}
              products={section.products}
              viewAllHref={section.viewAllHref}
              bg={i % 2 === 1 ? "gray" : "white"}
            />
          </LazySection>
        ))}
        <LazySection sectionId={HOME_SECTIONS.CATEGORIES} skeleton={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </LazySection>
        <LazySection sectionId={HOME_SECTIONS.QUALITY} skeleton={<WhySectionSkeleton />}>
          <WhyAnmasa />
        </LazySection>
        <LazySection sectionId={HOME_SECTIONS.ABOUT} skeleton={<SplitSectionSkeleton bg="cream" />}>
          <AboutSection />
        </LazySection>
        <LazySection sectionId={HOME_SECTIONS.FARM} skeleton={<FarmSectionSkeleton />}>
          <OurFarm />
        </LazySection>
        <LazySection skeleton={<TestimonialsSkeleton />}>
          <Testimonials />
        </LazySection>
        <LazySection sectionId={HOME_SECTIONS.CONTACT} skeleton={<ContactSkeleton />}>
          <ContactForm />
        </LazySection>
      </main>
      <Footer />
    </div>
  );
}
