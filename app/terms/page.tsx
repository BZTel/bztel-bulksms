import type { Metadata } from 'next';
import TermsPageClient from './terms-client';

export const metadata: Metadata = {
  title: "Terms of Service & Privacy Policy",
  description: "Read the BZTel terms of service, acceptable use policies, and privacy policies governing our communication APIs and custom software services.",
  alternates: {
    canonical: "https://bztel.com/terms",
  },
  openGraph: {
    title: "Terms of Service & Privacy Policy | BZTel",
    description: "Read the BZTel terms of service, acceptable use policies, and privacy policies.",
    url: "https://bztel.com/terms",
  },
};

export default function Page() {
  return <TermsPageClient />;
}
