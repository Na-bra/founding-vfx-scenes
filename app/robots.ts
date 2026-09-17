import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/download/", "/api/", "/admin", "/surprise", "/favorites"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
