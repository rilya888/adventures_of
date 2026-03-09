import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = APP_URL.replace(/\/$/, "");
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/create`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/orders`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
