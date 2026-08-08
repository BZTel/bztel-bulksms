import type { Metadata } from 'next';
import SoftwareDevelopmentPageClient from './software-client';

export const metadata: Metadata = {
  title: "Custom Software Development Services",
  description: "Get bespoke software solutions, enterprise web applications, mobile apps, and custom integration services designed by BZTel's expert engineering team.",
  alternates: {
    canonical: "https://bztel.com/software-development",
  },
  openGraph: {
    title: "Custom Software Development Services | BZTel",
    description: "Get bespoke software solutions, enterprise web applications, mobile apps, and custom integration services.",
    url: "https://bztel.com/software-development",
  },
};

export default function Page() {
  return <SoftwareDevelopmentPageClient />;
}
