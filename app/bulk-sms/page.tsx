import type { Metadata } from 'next';
import BulkSmsPageClient from './bulk-sms-client';

export const metadata: Metadata = {
  title: "Bulk SMS Messaging Service",
  description: "Send personalized Bulk SMS notifications and promotional messages globally. Affordable pricing, high throughput, and developer-friendly REST APIs.",
  alternates: {
    canonical: "https://bztel.com/bulk-sms",
  },
  openGraph: {
    title: "Bulk SMS Messaging Service | BZTel",
    description: "Send personalized Bulk SMS notifications and promotional messages globally.",
    url: "https://bztel.com/bulk-sms",
  },
};

export default function Page() {
  return <BulkSmsPageClient />;
}
