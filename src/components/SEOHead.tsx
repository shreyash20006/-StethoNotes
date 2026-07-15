import { Helmet } from 'react-helmet-async';
import type { SEOMeta } from '../lib/seo';
import { SITE_NAME, DEFAULT_OG_IMAGE, DEFAULT_META } from '../lib/seo';

interface SEOHeadProps extends Partial<SEOMeta> {
  /** JSON-LD structured data objects to inject (pass multiple schemas) */
  jsonLd?: object | object[];
}

/**
 * SEOHead — Drop this in any page to set full <head> SEO metadata.
 * Handles title, description, OG, Twitter Card, canonical, and JSON-LD.
 */
export default function SEOHead({
  title = DEFAULT_META.title,
  description = DEFAULT_META.description,
  keywords = DEFAULT_META.keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDesc = ogDescription || description;

  // Normalize jsonLd to always be an array
  const schemas = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      {/* ── Basic ── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* ── Robots ── */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* ── Open Graph ── */}
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@stethonotes" />

      {/* ── JSON-LD Structured Data ── */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Helmet>
  );
}
