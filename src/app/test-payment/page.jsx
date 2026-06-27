import TestPaymentClient from "./TestPaymentClient";

export const metadata = {
  title: "Payment Test",
  robots: { index: false, follow: false },
};

export default function TestPaymentPage() {
  return <TestPaymentClient />;
}
