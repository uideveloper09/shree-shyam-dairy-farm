import { CONTAINER, SECTION_CREAM, SECTION_WHITE, SECTION_HEAD, SECTION_HEAD_ALT, SECTION_HEAD_COMPACT } from "@/lib/layout";

function Shimmer({ className = "" }) {
  return <div className={`lazy-shimmer rounded-lg ${className}`} aria-hidden />;
}

export function ProductCarouselSkeleton({ bg = "white" }) {
  const sectionClass = bg === "gray" ? SECTION_CREAM : SECTION_WHITE;

  return (
    <section className={sectionClass} aria-hidden>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD}>
          <Shimmer className="mb-3 h-3 w-24" />
          <Shimmer className="h-8 w-56 sm:w-72" />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[260px] shrink-0 overflow-hidden rounded-2xl border border-[#f0f0f0] bg-white p-3 sm:w-[280px]"
            >
              <Shimmer className="aspect-square w-full rounded-xl" />
              <div className="mt-4 space-y-2 px-1">
                <Shimmer className="h-4 w-4/5" />
                <Shimmer className="h-3 w-1/2" />
                <Shimmer className="mt-3 h-5 w-1/3" />
                <Shimmer className="mt-4 h-11 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryGridSkeleton() {
  return (
    <section className={SECTION_WHITE} aria-hidden>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD}>
          <Shimmer className="mb-3 h-3 w-24" />
          <Shimmer className="h-8 w-64" />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[220px] shrink-0 overflow-hidden rounded-2xl border border-[#f0f0f0] bg-white sm:w-[260px]"
            >
              <Shimmer className="aspect-[4/5] w-full" />
              <div className="space-y-2 p-4">
                <Shimmer className="h-5 w-2/3" />
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhySectionSkeleton() {
  return (
    <section className={SECTION_CREAM} aria-hidden>
      <div className={CONTAINER}>
        <div className="mb-5 text-center">
          <Shimmer className="mx-auto mb-3 h-3 w-28" />
          <Shimmer className="mx-auto h-8 w-48" />
        </div>
        <Shimmer className="mx-auto h-64 max-w-sm rounded-2xl" />
      </div>
    </section>
  );
}

export function SplitSectionSkeleton({ bg = "cream" }) {
  const sectionClass = bg === "white" ? SECTION_WHITE : SECTION_CREAM;

  return (
    <section className={sectionClass} aria-hidden>
      <div className={CONTAINER}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Shimmer className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-4">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-9 w-4/5" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="mt-4 h-12 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FarmSectionSkeleton() {
  return (
    <section className={SECTION_WHITE} aria-hidden>
      <div className={CONTAINER}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-9 w-4/5" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-full" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Shimmer key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
            <Shimmer className="mt-4 h-12 w-40 rounded-lg" />
          </div>
          <Shimmer className="aspect-[4/3] w-full rounded-3xl" />
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSkeleton() {
  return (
    <section className={SECTION_CREAM} aria-hidden>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD_COMPACT}>
          <Shimmer className="mb-3 h-3 w-28" />
          <Shimmer className="h-8 w-72" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <Shimmer className="mt-4 h-40 w-full rounded-xl" />
      </div>
    </section>
  );
}

export function ContactSkeleton() {
  return (
    <section className={SECTION_WHITE} aria-hidden>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD_ALT}>
          <Shimmer className="mb-3 h-3 w-24" />
          <Shimmer className="h-8 w-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Shimmer className="min-h-[360px] rounded-2xl lg:min-h-[480px]" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Shimmer key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Shimmer className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
