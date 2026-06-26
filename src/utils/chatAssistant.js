import { formatINR } from "@/utils/cart";

export function buildKnowledgeBase(content) {
  const { site, products, categories, cart, about, farm, contact } = content;

  const productList = products
    .filter((p) => p.inStock !== false)
    .map(
      (p) =>
        `- ${p.name}: ${formatINR(p.price)} per ${p.unit}${p.compareAtPrice ? ` (MRP ${formatINR(p.compareAtPrice)})` : ""} — ${p.desc}`
    )
    .join("\n");

  const categoryList = categories.map((c) => `- ${c.label}: ${c.desc}`).join("\n");

  const coupons = cart?.coupons?.map((c) => `${c.code} (${c.label})`).join(", ") || "FRESH10";

  return {
    siteName: site.name,
    tagline: site.logoTagline,
    location: site.location,
    phone: site.phone,
    email: site.email,
    whatsapp: site.whatsappNumber,
    hours: site.hours,
    promo: site.promo,
    deliveryNote: site.deliveryNote,
    about: about?.body,
    farm: farm?.description,
    farmFeatures: farm?.features?.join(", "),
    contactTitle: contact?.title,
    products: productList,
    categories: categoryList,
    freeShippingMin: cart?.freeShippingMin,
    shippingCharge: cart?.shippingCharge,
    coupons,
  };
}

export function buildSystemPrompt(kb) {
  return `You are "${kb.siteName} Assistant" — a friendly, helpful AI chatbot for an Indian dairy farm website.

RULES:
- Answer ONLY about ${kb.siteName}, its products, orders, delivery, farm, and contact info.
- Reply in the same language the user uses (Hindi, Hinglish, or English).
- Keep answers concise (2-4 short paragraphs max). Use bullet points for product lists.
- Be warm and trustworthy — this is a family dairy farm brand.
- For orders: tell users to add items to cart on website or WhatsApp at +${kb.whatsapp}.
- Never invent products, prices, or policies not listed below.
- If unsure, suggest calling ${kb.phone} or emailing ${kb.email}.

BUSINESS INFO:
- Tagline: ${kb.tagline}
- Location: ${kb.location}
- Phone: ${kb.phone}
- Email: ${kb.email}
- WhatsApp: +${kb.whatsapp}
- Hours: ${kb.hours}
- Promo: ${kb.promo}
- Delivery: ${kb.deliveryNote}
- Free shipping on orders above ₹${kb.freeShippingMin}; otherwise ₹${kb.shippingCharge} shipping.
- Coupons: ${kb.coupons}

ABOUT:
${kb.about}

OUR FARM:
${kb.farm}
Features: ${kb.farmFeatures}

CATEGORIES:
${kb.categories}

PRODUCTS & PRICES:
${kb.products}`;
}

function includesAny(text, words) {
  return words.some((w) => text.includes(w));
}

export function getLocalReply(userMessage, content) {
  const kb = buildKnowledgeBase(content);
  const msg = userMessage.toLowerCase().trim();
  const { site, products, cart } = content;

  if (!msg) {
    return "Kripya apna sawaal likhiye — main products, delivery, ya order ke baare mein madad kar sakta hoon.";
  }

  if (includesAny(msg, ["hello", "hi", "hey", "namaste", "namaskar", "kaise ho"])) {
    return `Namaste! 🙏 Main ${site.name} ka assistant hoon.\n\nAap products, prices, delivery, ya order ke baare mein poochh sakte hain. Kaise madad karun?`;
  }

  if (
    includesAny(msg, [
      "product",
      "price",
      "rate",
      "cost",
      "kitne",
      "doodh",
      "milk",
      "ghee",
      "paneer",
      "dahi",
      "curd",
      "chaach",
      "chach",
      "combo",
    ])
  ) {
    const list = products
      .filter((p) => p.inStock !== false)
      .slice(0, 8)
      .map((p) => `• ${p.name} — ${formatINR(p.price)}/${p.unit}`)
      .join("\n");
    return `Hamare farm-fresh products:\n\n${list}\n\nPoori list ke liye website par **Shop All** (#products) dekhein. Order cart mein add karke checkout kar sakte hain.`;
  }

  if (
    includesAny(msg, ["order", "buy", "purchase", "checkout", "cart", "khareed", "kaise order"])
  ) {
    return `Order karne ke liye:\n\n1. Website par products browse karein (#products)\n2. **Add to Cart** par click karein\n3. Cart se **Safe Checkout** karein (Razorpay/UPI)\n\nYa seedha WhatsApp par order karein: wa.me/${site.whatsappNumber}\n\nCoupon: **FRESH10** — first order par 10% off!`;
  }

  if (includesAny(msg, ["deliver", "delivery", "ship", "bihar", "ghar tak", "same day"])) {
    return `${site.deliveryNote}\n\n${site.location} mein delivery available hai. Same-day delivery ke liye subah jaldi order karein.\n\nDetails ke liye call karein: ${site.phone}`;
  }

  if (includesAny(msg, ["contact", "phone", "call", "email", "whatsapp", "number", "reach"])) {
    return `Humse contact karein:\n\n📞 Phone: ${site.phone}\n📧 Email: ${site.email}\n💬 WhatsApp: wa.me/${site.whatsappNumber}\n📍 ${site.location}\n🕐 ${site.hours}`;
  }

  if (includesAny(msg, ["hour", "time", "open", "close", "timing", "kab", "samay"])) {
    return `Hamare working hours:\n\n🕐 ${site.hours}\n\nIs time ke andar call, WhatsApp, ya website se order kar sakte hain.`;
  }

  if (includesAny(msg, ["coupon", "discount", "offer", "fresh10", "promo", "off"])) {
    const couponLines =
      cart?.coupons?.map((c) => `• **${c.code}** — ${c.label}`).join("\n") ||
      "• **FRESH10** — First order 10% off";
    return `Current offers:\n\n${site.promo}\n\n${couponLines}\n\nCart mein coupon code apply karein checkout se pehle.`;
  }

  if (
    includesAny(msg, [
      "farm",
      "gaay",
      "cow",
      "about",
      "story",
      "quality",
      "fresh",
      "pure",
      "shuddh",
    ])
  ) {
    return `${content.about?.body || kb.about}\n\n🐄 ${content.farm?.description || kb.farm}\n\nVisit section: #farm ya #about`;
  }

  if (includesAny(msg, ["payment", "pay", "upi", "razorpay", "cod", "cash"])) {
    return `Payment options:\n\n• Online checkout via **Razorpay** (UPI, Google Pay, PhonePe, cards)\n• WhatsApp order par UPI/bank transfer\n\nPrepaid orders par ${cart?.prepaidDiscountPercent || 5}% extra discount bhi mil sakta hai.`;
  }

  if (includesAny(msg, ["thank", "dhanyavad", "shukriya", "thanks"])) {
    return `Aapka swagat hai! 🙏 ${site.logoTagline}\n\nAur kuch poochhna ho toh zaroor likhiye.`;
  }

  return `Main ${site.name} ke products, delivery, aur orders ke baare mein madad kar sakta hoon.\n\nTry karein:\n• "Products aur prices"\n• "Order kaise karun?"\n• "Delivery Bihar mein?"\n• "Contact details"\n\nYa seedha call karein: ${site.phone}`;
}

export async function getAiReply(messages, content) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      reply: getLocalReply(lastUser?.content || "", content),
      mode: "local",
    };
  }

  const kb = buildKnowledgeBase(content);
  const systemPrompt = buildSystemPrompt(kb);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      reply: getLocalReply(lastUser?.content || "", content),
      mode: "local",
    };
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      reply: getLocalReply(lastUser?.content || "", content),
      mode: "local",
    };
  }

  return { reply, mode: "ai" };
}
