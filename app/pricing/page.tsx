import type { Metadata } from 'next';
import PricingPageClient from './pricing-client';

export const metadata: Metadata = {
  title: "Simple, Transparent Pricing",
  description: "Calculate your Bulk SMS, Voice API, WhatsApp Business API, and Email Blast costs with our transparent pay-as-you-go pricing calculator.",
  alternates: {
    canonical: "https://bztel.com/pricing",
  },
  openGraph: {
    title: "Simple, Transparent Pricing | BZTel",
    description: "Calculate your Bulk SMS, Voice API, WhatsApp Business API, and Email Blast costs.",
    url: "https://bztel.com/pricing",
  },
};

export default function Page() {
  return <PricingPageClient />;
}
