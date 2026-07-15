import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SITE_URL = "https://www.stethonotes.store";

serve(async (req) => {
  try {
    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 2. Fetch active study notes
    const { data: notes, error } = await supabase
      .from("notes")
      .select("id, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes for sitemap:", error);
    }

    // 3. Construct sitemap.xml content
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

  <!-- Static Routes -->
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/courses</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${SITE_URL}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${SITE_URL}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/track-order</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

    // 4. Append Dynamic Study Note Routes
    if (notes && notes.length > 0) {
      notes.forEach((note) => {
        const lastmod = note.updated_at
          ? new Date(note.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        xml += `  <url>
    <loc>${SITE_URL}/notes/${note.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });
    }

    xml += `</urlset>`;

    // 5. Return XML response
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });

  } catch (err) {
    console.error("Sitemap generation exception:", err);
    return new Response(`Error generating sitemap: ${err.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
