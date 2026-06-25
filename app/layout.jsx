import { Playfair_Display, Poppins, Marcellus, Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";
import { getContent } from "@/lib/data";
import { CartProvider } from "@/context/CartContext";
import { SiteDataProvider } from "@/context/SiteDataContext";
import CartDrawer from "@/components/ui/CartDrawer";
import ChatAssistant from "@/components/ui/ChatAssistant";
import ScrollToTop from "@/components/ui/ScrollToTop";
import PageLoader from "@/components/ui/PageLoader";
import ScrollUnlock from "@/components/ui/ScrollUnlock";
import { SectionScrollProvider } from "@/context/SectionScrollContext";

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

const logoFont = Marcellus({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-tagline",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#082F63",
};

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
      suppressHydrationWarning
      className={`${playfair.variable} ${poppins.variable} ${logoFont.variable} ${cormorant.variable} ${greatVibes.variable} scroll-smooth`}
    >
      <body suppressHydrationWarning className="m-0 min-h-full p-0 font-body antialiased text-gray-900">
        <ScrollUnlock />
        <SectionScrollProvider>
          <PageLoader />
          <SiteDataProvider content={content}>
            <CartProvider>
              {children}
              <CartDrawer />
              <ChatAssistant />
              <ScrollToTop />
            </CartProvider>
          </SiteDataProvider>
        </SectionScrollProvider>
      </body>
    </html>
  );
}
