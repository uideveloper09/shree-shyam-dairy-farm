"use client";

import Image from "next/image";
import MotionReveal from "@/components/ui/MotionReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { CONTAINER } from "@/lib/layout";

export default function OurFarm() {
  const features = [
    "200+ Healthy Cows",
    "Organic Green Fodder",
    "Clean & Hygienic Farm",
    "Daily Fresh Milk Production",
    "Veterinary Care Available",
    "Direct Farm To Home Delivery",
  ];

  return (
    <section id="farm" className="bg-white py-[80px]">
      <div className={CONTAINER}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Image */}
          <MotionReveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[24px]">
              <Image
                src="/images/our-farm-banner.png"
                alt="Shree Shyam Dairy Farm"
                width={700}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
          </MotionReveal>

          {/* Right Content */}
          <MotionReveal delay={0.2}>
            <div>

              <SectionHeading
                label="Our Farm"
                title="Jahan Se Shuru Hoti Hai Shuddhata"
              />

              <p className="mt-6 text-[#666] leading-8">
                Shree Shyam Dairy Farm mein hum har din taaza,
                poshtik aur shuddh dairy products taiyaar karte hain.
                Hamare gaayon ko saaf-suthra vatavaran,
                santulit aahar aur niyamit veterinary care di jaati hai.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {features.map((item) => (
                  <div
                    key={item}
                    className="
                      rounded-xl border border-[#E8E8E8]
                      p-4 bg-[#FAFAFA]
                    "
                  >
                    <span className="text-[#082F63] font-semibold">
                      ✓ {item}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="
                  mt-8
                  bg-[#082F63]
                  text-white
                  px-8
                  py-3
                  rounded-lg
                  hover:bg-[#0B3D7A]
                  transition
                "
              >
                Visit Our Farm
              </button>

            </div>
          </MotionReveal>

        </div>
      </div>
    </section>
  );
}