import type { Metadata } from 'next';
import VoiceApiPageClient from './voice-client';

export const metadata: Metadata = {
  title: "Voice API & Text-to-Speech",
  description: "Build interactive voice response (IVR) systems, automate phone verification, and run text-to-speech voice campaigns with BZTel Voice API.",
  alternates: {
    canonical: "https://bztel.com/voice-api",
  },
  openGraph: {
    title: "Voice API & Text-to-Speech | BZTel",
    description: "Build interactive voice response (IVR) systems, automate phone verification, and run text-to-speech voice campaigns.",
    url: "https://bztel.com/voice-api",
  },
};

export default function Page() {
  return <VoiceApiPageClient />;
}
