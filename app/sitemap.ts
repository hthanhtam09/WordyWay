import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
    // TODO: nếu có slug động từ DB, map thêm vào đây
    return [
        { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ];
}


