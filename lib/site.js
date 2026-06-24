export const SITE = {
  name: "Shree Shyam Dairy Farm",
  shortName: "Shree Shyam",
  logoTagline: "Farm Se Seedha Aapke Ghar Tak",
  hindiTagline: "शुद्ध दूध, Seedha Aapke Ghar Tak",
  tagline: "Fresh & Pure Dairy Products",
  location: "Bihar, India",
  phone: "+91 98765 43210",
  email: "shreeshyamdairyfarm@gmail.com",
  hours: "Mon - Sun: 6:00 AM - 10:00 PM",
  description:
    "Pure, fresh and natural dairy products straight from our farm to your home in Bihar, India.",
  footerDesc:
    "Shree Shyam Dairy Farm se aapke ghar tak shuddh, taaza aur poshtik dairy products — bina kisi bichauliye ke.",
};

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Our Products", href: "#products" },
  { label: "Our Farm", href: "#farm" },
  { label: "Quality", href: "#quality" },
  { label: "Contact Us", href: "#contact" },
];

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
  { label: "WhatsApp", href: "https://wa.me/919876543210", icon: "whatsapp" },
];

export const FEATURES = [
  { title: "100% Natural", desc: "No Chemicals", icon: "leaf" },
  { title: "Happy Cows", desc: "Healthy Milk", icon: "cow" },
  { title: "Hygienic & Safe", desc: "Premium Quality", icon: "droplet" },
  { title: "Farm Se Seedha", desc: "Aapke Ghar Tak", icon: "home" },
];

export const PRODUCTS = [
  {
    name: "Cow Milk",
    desc: "100% Pure & Fresh",
    image: "/images/products/Cow-Milk.png",
    imageClass: "object-cover object-center",
  },
  {
    name: "Dahi",
    desc: "Fresh & Healthy",
    image: "/images/products/Dahi.png",
    imageClass: "object-cover object-center",
  },
  {
    name: "Desi Ghee",
    desc: "Pure & Aromatic",
    image: "/images/products/Desi-Ghee.png",
    imageClass: "object-cover object-center",
  },
  {
    name: "Paneer",
    desc: "Soft & Protein Rich",
    image: "/images/products/Paneer.png",
    imageClass: "object-cover object-center",
  },
  {
    name: "Chaach",
    desc: "Healthy & Refreshing",
    image: "/images/products/Chaach.png",
    imageClass: "object-cover object-center",
  },
];

export const WHY_CHOOSE = [
  {
    title: "Apne Farm Ki Gaaye",
    desc: "Healthy Cows, Better Milk",
    icon: "cow",
  },
  {
    title: "Hygienic Process",
    desc: "Modern Equipment, Safe & Clean",
    icon: "shield",
  },
  {
    title: "100% Natural",
    desc: "No Added Preservatives & Chemicals",
    icon: "leaf",
  },
  {
    title: "Timely Delivery",
    desc: "Fast & Reliable Home Delivery",
    icon: "truck",
  },
];

export const FOOTER_LINKS = {
  quick: NAV_LINKS,
  products: PRODUCTS.map((p) => ({ label: p.name, href: "#products" })),
};
