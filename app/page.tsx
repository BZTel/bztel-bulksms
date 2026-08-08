import type { Metadata } from 'next';
import HomePageClient from './home-client';

export const metadata: Metadata = {
  title: "BZTel - Communication APIs & Custom Software",
  description: "BZTel provides powerful communication APIs and custom software development services.",
  alternates: {
    canonical: "https://bztel.com",
  },
};

export default function Page() {
  return <HomePageClient />;
}
