import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/profile/edit", "/upload", "/auth/", "/admin", "/api/", "/saved", "/collections", "/notifications", "/settings"],
      },
    ],
    sitemap: "https://ratemyplate.net/sitemap.xml",
  };
}
