import type { Metadata } from 'next';
import ContactPageClient from './contact-client';

export const metadata: Metadata = {
  title: "Contact Our Sales & Support Team",
  description: "Get in touch with BZTel for custom API pricing, software engineering consulting, or product support. We are here to help your business grow.",
  alternates: {
    canonical: "https://bztel.com/contact",
  },
  openGraph: {
    title: "Contact Our Sales & Support Team | BZTel",
    description: "Get in touch with BZTel for custom API pricing, software engineering consulting, or product support.",
    url: "https://bztel.com/contact",
  },
};

export default function Page() {
  return <ContactPageClient />;
}
