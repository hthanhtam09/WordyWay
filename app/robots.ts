import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: "*", allow: "/" },
            { userAgent: "GPTBot", disallow: "/" },
            { userAgent: "Google-Extended", disallow: "/" },
            { userAgent: "Applebot-Extended", disallow: "/" },
            { userAgent: "ClaudeBot", disallow: "/" },
            { userAgent: "Claude-User", disallow: "/" },
            { userAgent: "Claude-SearchBot", disallow: "/" },
            { userAgent: "CCBot", disallow: "/" },
            { userAgent: "PerplexityBot", disallow: "/" },
        ],
        sitemap: `${BASE}/sitemap.xml`,
        host: BASE,
    };
}


