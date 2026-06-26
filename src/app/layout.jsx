import {
  Playfair_Display,
  Poppins,
  Marcellus,
  Cormorant_Garamond,
  Great_Vibes,
} from "next/font/google";
import "../styles/globals.css";
import { getContent } from "@/utils/data";
import { CartProvider } from "@/features/cart/context/CartContext";
import { SiteDataProvider } from "@/features/cart/context/SiteDataContext";
import CartDrawer from "@/components/ui/CartDrawer";
import ChatAssistant from "@/components/ui/ChatAssistant";
import ScrollToTop from "@/components/ui/ScrollToTop";
import PageLoader from "@/components/ui/PageLoader";
import ScrollUnlock from "@/components/ui/ScrollUnlock";
import { SectionScrollProvider } from "@/features/cart/context/SectionScrollContext";
import QueryProvider from "@/features/providers/QueryProvider";
import { getServerTenantConfig } from "@/lib/tenant/server";
import TenantThemeInjector from "@/features/tenant/TenantThemeInjector";
import { TenantProvider } from "@/features/tenant/TenantProvider";

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#082F63",
};

export async function generateMetadata() {
  const { site } = await getContent();
  return {
    title: `${site.name} | Pure & Fresh Dairy Products`,
    description: site.description,
    manifest: "/manifest.json",
    keywords: ["dairy farm", "fresh milk", "paneer", "dahi", "ghee", "chaach", "Bihar", site.name],
    openGraph: {
      title: site.name,
      description: site.description,
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }) {
  const [content, tenantConfig] = await Promise.all([getContent(), getServerTenantConfig()]);

  return (
    <html
      lang={tenantConfig?.locale?.defaultLocale || "en"}
      suppressHydrationWarning
      className={`${playfair.variable} ${poppins.variable} ${logoFont.variable} ${cormorant.variable} ${greatVibes.variable} scroll-smooth`}
    >
      <head>
        <TenantThemeInjector />
      </head>
      <body
        suppressHydrationWarning
        className="m-0 min-h-dvh p-0 font-body antialiased text-gray-900"
      >
        <ScrollUnlock />
        <SectionScrollProvider>
          <PageLoader />
          <QueryProvider>
            <TenantProvider config={tenantConfig}>
              <SiteDataProvider content={content}>
                <CartProvider>
                  {children}
                  <CartDrawer />
                  <ChatAssistant />
                  <ScrollToTop />
                </CartProvider>
              </SiteDataProvider>
            </TenantProvider>
          </QueryProvider>
        </SectionScrollProvider>
      </body>
    </html>
  );
}
