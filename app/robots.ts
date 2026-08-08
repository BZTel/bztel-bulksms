import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin.html', '/app.html'],
    },
    sitemap: 'https://bztel.com/sitemap.xml',
  };
}
