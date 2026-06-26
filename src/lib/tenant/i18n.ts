import type { SupportedLocale } from "@/constants/tenant";

const messages: Record<SupportedLocale, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.cart": "Cart",
    "nav.account": "Account",
    "cta.order": "Order Now",
    "cta.subscribe": "Subscribe Milk",
    "footer.tagline": "Pure & fresh dairy delivered to your door",
  },
  hi: {
    "nav.home": "होम",
    "nav.products": "उत्पाद",
    "nav.cart": "कार्ट",
    "nav.account": "खाता",
    "cta.order": "अभी ऑर्डर करें",
    "cta.subscribe": "दूध सब्सक्रिप्शन",
    "footer.tagline": "शुद्ध और ताज़ा डेयरी आपके द्वार पर",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.products": "المنتجات",
    "nav.cart": "السلة",
    "nav.account": "الحساب",
    "cta.order": "اطلب الآن",
    "cta.subscribe": "اشترك في الحليب",
    "footer.tagline": "منتجات ألبان طازجة ونقية إلى بابك",
  },
  gu: {
    "nav.home": "હોમ",
    "nav.products": "ઉત્પાદનો",
    "nav.cart": "કાર્ટ",
    "nav.account": "એકાઉન્ટ",
    "cta.order": "હમણાં ઓર્ડર કરો",
    "cta.subscribe": "દૂધ સબ્સ્ક્રિપ્શન",
    "footer.tagline": "શુદ્ધ અને તાજું ડેરી તમારા દરવાજે",
  },
  mr: {
    "nav.home": "होम",
    "nav.products": "उत्पादने",
    "nav.cart": "कार्ट",
    "nav.account": "खाते",
    "cta.order": "आत्ता ऑर्डर करा",
    "cta.subscribe": "दूध सबस्क्रिप्शन",
    "footer.tagline": "शुद्ध आणि ताजे डेअरी तुमच्या दारात",
  },
};

export function t(locale: string, key: string): string {
  const loc = (locale in messages ? locale : "en") as SupportedLocale;
  return messages[loc][key] ?? messages.en[key] ?? key;
}

export function getMessages(locale: string): Record<string, string> {
  const loc = (locale in messages ? locale : "en") as SupportedLocale;
  return { ...messages.en, ...messages[loc] };
}
