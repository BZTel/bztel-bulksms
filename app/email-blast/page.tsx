import type { Metadata } from 'next';
import EmailBlastPageClient from './email-client';

export const metadata: Metadata = {
  title: "Email Blast & Marketing Campaigns",
  description: "Create and launch large-scale email campaigns that land in the inbox. Beautiful responsive templates, detailed analytics, and SMTP relay servers.",
  alternates: {
    canonical: "https://bztel.com/email-blast",
  },
  openGraph: {
    title: "Email Blast & Marketing Campaigns | BZTel",
    description: "Create and launch large-scale email campaigns that land in the inbox.",
    url: "https://bztel.com/email-blast",
  },
};

export default function Page() {
  return <EmailBlastPageClient />;
}
