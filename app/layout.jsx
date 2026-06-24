import { Playfair_Display, Poppins, Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { getContent } from "@/lib/data";
import { CartProvider } from "@/context/CartContext";
import { SiteDataProvider } from "@/context/SiteDataContext";
import CartDrawer from "@/components/ui/CartDrawer";
import ChatAssistant from "@/components/ui/ChatAssistant";
import ScrollToTop from "@/components/ui/ScrollToTop";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-tagline",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { site } = await getContent();
  return {
    title: `${site.name} | Pure & Fresh Dairy Products`,
    description: site.description,
    keywords: [
      "dairy farm",
      "fresh milk",
      "paneer",
      "dahi",
      "ghee",
      "chaach",
      "Bihar",
      site.name,
    ],
    openGraph: {
      title: site.name,
      description: site.description,
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }) {
  const content = await getContent();

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${poppins.variable} ${cinzel.variable} ${cormorant.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-body antialiased bg-[#faf9f6] text-gray-900">
        <SiteDataProvider content={content}>
          <CartProvider>
            {children}
            <CartDrawer />
            <ChatAssistant />
            <ScrollToTop />
          </CartProvider>
        </SiteDataProvider>
      </body>
    </html>
  );
}
