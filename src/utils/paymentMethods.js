export const UPI_METHODS = new Set(["upi", "gpay", "phonepe", "paytm"]);

export const PAYMENT_METHOD_META = {
  upi: {
    id: "upi",
    label: "UPI",
    shortLabel: "UPI",
    scanLabel: "Scan with any UPI app",
    openLabel: "Open UPI app",
    desc: "BHIM & any UPI app",
    accent: "from-[#5F259F]/10 to-[#097939]/10",
    ring: "ring-[#5F259F]/25",
    frame: "border-[#5F259F]/20 bg-gradient-to-b from-[#5F259F]/5 to-white",
    scanColor: "#5F259F",
    brandColor: "#5F259F",
  },
  gpay: {
    id: "gpay",
    label: "Google Pay",
    shortLabel: "GPay",
    scanLabel: "Scan with Google Pay",
    openLabel: "Open Google Pay",
    desc: "Fast & secure checkout",
    accent: "from-[#4285F4]/10 to-[#34A853]/10",
    ring: "ring-[#4285F4]/25",
    frame: "border-[#4285F4]/20 bg-gradient-to-b from-[#4285F4]/5 to-white",
    scanColor: "#4285F4",
    brandColor: "#4285F4",
  },
  phonepe: {
    id: "phonepe",
    label: "PhonePe",
    shortLabel: "PhonePe",
    scanLabel: "Scan with PhonePe",
    openLabel: "Open PhonePe",
    desc: "India's trusted UPI app",
    accent: "from-[#5F259F]/12 to-[#5F259F]/5",
    ring: "ring-[#5F259F]/30",
    frame: "border-[#5F259F]/25 bg-gradient-to-b from-[#5F259F]/8 to-white",
    scanColor: "#5F259F",
    brandColor: "#5F259F",
  },
  paytm: {
    id: "paytm",
    label: "Paytm",
    shortLabel: "Paytm",
    scanLabel: "Scan with Paytm",
    openLabel: "Open Paytm",
    desc: "Paytm UPI & wallet",
    accent: "from-[#00BAF2]/12 to-[#002E6E]/8",
    ring: "ring-[#00BAF2]/30",
    frame: "border-[#00BAF2]/25 bg-gradient-to-b from-[#00BAF2]/8 to-white",
    scanColor: "#00BAF2",
    brandColor: "#00BAF2",
  },
  card: {
    id: "card",
    label: "Card",
    shortLabel: "Card",
    scanLabel: "Enter card securely",
    openLabel: "Pay with card",
    desc: "Visa, Mastercard, RuPay",
    accent: "from-[#082F63]/10 to-[#C89B3C]/10",
    ring: "ring-[#082F63]/20",
    frame: "border-[#082F63]/15 bg-gradient-to-b from-[#082F63]/5 to-white",
    scanColor: "#082F63",
    brandColor: "#082F63",
  },
};

export function getRazorpayCheckoutOptions(paymentMethod) {
  if (paymentMethod === "card") {
    return {
      method: {
        card: true,
        upi: false,
        netbanking: false,
        wallet: false,
        paylater: false,
      },
    };
  }

  const isMobile =
    typeof window !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return {
    method: {
      card: false,
      upi: true,
      netbanking: false,
      wallet: false,
      paylater: false,
    },
    upi: {
      flow: isMobile ? "intent" : "qr",
    },
  };
}
