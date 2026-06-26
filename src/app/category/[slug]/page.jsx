import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategorySlugs, getContent } from "@/utils/data";
import CategoryPageView from "@/components/CategoryPageView";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) return {};

  const { site } = await getContent();
  return {
    title: `${data.category.label} | ${site.name}`,
    description: data.category.desc,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);

  if (!data) notFound();

  return <CategoryPageView category={data.category} products={data.products} />;
}
