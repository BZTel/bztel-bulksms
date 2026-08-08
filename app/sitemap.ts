import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bztel.com';
  const routes = [
    '',
    '/bulk-sms',
    '/whatsapp-api',
    '/voice-api',
    '/email-blast',
    '/pricing',
    '/software-development',
    '/contact',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
