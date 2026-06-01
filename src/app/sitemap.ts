import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ggi-final.vercel.app';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/sign-in`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/sign-up`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
