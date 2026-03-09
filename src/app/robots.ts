import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = APP_URL.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account", "/checkout/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
