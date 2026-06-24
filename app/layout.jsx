import { Playfair_Display, Poppins, Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

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

export const metadata = {
  title: `${SITE.name} | Pure & Fresh Dairy Products`,
  description: SITE.description,
  keywords: [
    "dairy farm",
    "fresh milk",
    "paneer",
    "dahi",
    "ghee",
    "chaach",
    "Bihar",
    "Shree Shyam Dairy Farm",
  ],
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable} ${cinzel.variable} ${cormorant.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-body antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}

export const metadata = {
  title: "Shree Shyam Dairy Farm",
  description: "Fresh & Pure Dairy Products",
  icons: {
    icon: "/favicon.ico",
  },
};
