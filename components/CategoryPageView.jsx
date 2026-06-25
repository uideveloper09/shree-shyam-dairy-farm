"use client";

import Link from "next/link";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import PromoBanner from "@/components/PromoBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER, SECTION_WHITE } from "@/lib/layout";

export default function CategoryPageView({ category, products }) {
  const { site } = useSiteData();

  return (
    <div className="site-shell">
      <PromoBanner />
      <TopBar />
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[#061E3D]">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <Image
              src={category.image}
              alt=""
              fill
              className="object-cover blur-sm"
              sizes="100vw"
              priority
            />
          </div>
          <div className={`${CONTAINER} relative py-6 sm:py-8`}>
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-white/60 transition hover:text-[#C89B3C]"
            >
              ← Back to home
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C89B3C]">
              Shop by category
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {category.label}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70">
              {category.desc}
            </p>
          </div>
        </section>

        <section className={SECTION_WHITE}>
          <div className={CONTAINER}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#eee] pb-2">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#C89B3C]">
                  {site.name}
                </p>
                <h2 className="font-heading text-2xl font-bold text-[#082F63] sm:text-3xl">
                  All {category.label} Products
                </h2>
              </div>
              <p className="text-[13px] text-gray-500">
                {products.length} product{products.length === 1 ? "" : "s"}
              </p>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <div key={product.id} className="min-w-0 [&>article]:w-full [&>article]:max-w-none">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#eee] bg-[#faf9f6] px-6 py-16 text-center">
                <p className="font-heading text-xl font-semibold text-[#082F63]">
                  No products available right now
                </p>
                <p className="mt-2 text-[14px] text-gray-500">
                  Please check back soon or browse our full shop.
                </p>
                <Link href="/#products" className="btn-premium-navy mt-6 inline-flex h-11 px-8">
                  Shop all products
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer showTagline={false} />
    </div>
  );
}
