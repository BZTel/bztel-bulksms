import type { Metadata } from 'next';
import WhatsappApiPageClient from './whatsapp-client';

export const metadata: Metadata = {
  title: "WhatsApp Business API",
  description: "Integrate WhatsApp Business API for automated customer alerts, marketing broadcasts, and interactive chat flows. High delivery rates and simple API integration.",
  alternates: {
    canonical: "https://bztel.com/whatsapp-api",
  },
  openGraph: {
    title: "WhatsApp Business API | BZTel",
    description: "Integrate WhatsApp Business API for automated customer alerts, marketing broadcasts, and interactive chat flows.",
    url: "https://bztel.com/whatsapp-api",
  },
};

export default function Page() {
  return <WhatsappApiPageClient />;
}
