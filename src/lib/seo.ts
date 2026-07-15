/**
 * SEO utility library for StethoNotes
 * Centralised meta generation for all pages
 */

export const SITE_URL = 'https://www.stethonotes.store';
export const SITE_NAME = 'StethoNotes';
export const SITE_LOGO = `${SITE_URL}/favicon.svg`;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SEOMeta {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noIndex?: boolean;
}

/** Default site-level meta */
export const DEFAULT_META: SEOMeta = {
  title: 'StethoNotes | Digital Medical Study Notes & Topper Guides PDF',
  description:
    "StethoNotes is India's leading marketplace for medical, BHMS, BAMS, BSc Nursing, B.Pharma, and BPT study notes. Access high-yield topper-curated PDFs instantly.",
  keywords:
    'MBBS notes PDF, BHMS study guides, BAMS anatomy notes, nursing lecture notes, pharmacology revision sheets, medical exam helper, MBBS topper notes, medical study material India',
  canonical: SITE_URL,
  ogType: 'website',
  ogImage: DEFAULT_OG_IMAGE,
  twitterCard: 'summary_large_image',
};

/** Page-specific meta factories */
export const pageMeta = {
  home: (): SEOMeta => ({
    ...DEFAULT_META,
    title: 'StethoNotes | Buy Medical Study Notes PDF — MBBS, BHMS, BAMS, Nursing',
    description:
      "India's #1 marketplace for medical study notes. Buy high-yield PDFs for MBBS, BHMS, BAMS, BSc Nursing, B.Pharma & BPT. Curated by toppers, instant download.",
    canonical: `${SITE_URL}/`,
  }),

  courses: (courseName?: string): SEOMeta => ({
    ...DEFAULT_META,
    title: courseName
      ? `${courseName} Study Notes PDF | StethoNotes`
      : 'All Medical Courses & Study Notes | StethoNotes',
    description: courseName
      ? `Browse high-yield ${courseName} study notes, lecture PDFs, and topper guides. Instant download on StethoNotes.`
      : 'Browse all medical courses: MBBS, BHMS, BAMS, BSc Nursing, B.Pharma, BPT. Download topper-curated study notes instantly.',
    keywords: `${courseName || 'medical'} notes PDF, ${courseName || 'medical'} study material, medical exam preparation`,
    canonical: `${SITE_URL}/courses`,
    ogType: 'website',
  }),

  product: (note: {
    id: string;
    title: string;
    description?: string;
    price?: number;
    thumbnail_url?: string;
    subject?: string;
    course?: { name?: string };
    avg_rating?: number;
    review_count?: number;
  }): SEOMeta => ({
    title: `${note.title} | StethoNotes`,
    description: note.description
      ? note.description.substring(0, 155) + (note.description.length > 155 ? '...' : '')
      : `Download ${note.title} PDF study notes. High-yield ${note.subject || 'medical'} notes for ${note.course?.name || 'medical students'}.`,
    keywords: `${note.title}, ${note.subject || ''} notes PDF, ${note.course?.name || 'medical'} study material, ${note.subject || ''} study guide`,
    canonical: `${SITE_URL}/notes/${note.id}`,
    ogType: 'product',
    ogTitle: note.title,
    ogDescription: note.description?.substring(0, 200) || `Buy ${note.title} PDF`,
    ogImage: note.thumbnail_url || DEFAULT_OG_IMAGE,
    twitterCard: 'summary_large_image',
  }),

  contact: (): SEOMeta => ({
    ...DEFAULT_META,
    title: 'Contact Us | StethoNotes Support',
    description:
      'Get in touch with StethoNotes support for any questions about your medical study notes, orders, or seller enquiries. We reply within 24 hours.',
    canonical: `${SITE_URL}/contact`,
    keywords: 'StethoNotes contact, medical notes support, seller enquiry',
  }),

  privacy: (): SEOMeta => ({
    ...DEFAULT_META,
    title: 'Privacy Policy | StethoNotes',
    description:
      'Read the StethoNotes privacy policy to understand how we collect, use, and protect your data.',
    canonical: `${SITE_URL}/privacy`,
    noIndex: false,
  }),

  terms: (): SEOMeta => ({
    ...DEFAULT_META,
    title: 'Terms of Service | StethoNotes',
    description:
      'Review StethoNotes terms of service governing purchases, downloads, and use of medical study notes.',
    canonical: `${SITE_URL}/terms`,
    noIndex: false,
  }),

  login: (): SEOMeta => ({
    ...DEFAULT_META,
    title: 'Login | StethoNotes',
    description: 'Sign in to your StethoNotes account to access your purchased medical study notes.',
    canonical: `${SITE_URL}/login`,
    noIndex: true,
  }),

  dashboard: (): SEOMeta => ({
    ...DEFAULT_META,
    title: 'My Dashboard | StethoNotes',
    description: 'Access your StethoNotes student dashboard to download purchased notes and manage your account.',
    canonical: `${SITE_URL}/dashboard`,
    noIndex: true,
  }),

  notFound: (): SEOMeta => ({
    ...DEFAULT_META,
    title: '404 — Page Not Found | StethoNotes',
    description: 'This page could not be found. Explore StethoNotes medical study notes.',
    canonical: SITE_URL,
    noIndex: true,
  }),
};

/** Generate JSON-LD for Organization / WebSite */
export function generateOrganizationLD() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: SITE_LOGO,
          width: 200,
          height: 60,
        },
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@stethonotes.store',
          contactType: 'customer support',
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_META.description,
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/courses?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-IN',
      },
    ],
  };
}

/** Generate JSON-LD for a Product page */
export function generateProductLD(note: {
  id: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail_url?: string;
  subject?: string;
  course?: { name?: string };
  avg_rating?: number;
  review_count?: number;
  created_at?: string;
  seller_name?: string;
}) {
  const productUrl = `${SITE_URL}/notes/${note.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: note.title,
    description: note.description || `High-yield ${note.subject} study notes`,
    image: note.thumbnail_url || DEFAULT_OG_IMAGE,
    url: productUrl,
    sku: note.id,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: note.price ?? 0,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: note.seller_name || SITE_NAME,
      },
    },
    ...(note.avg_rating && note.review_count && note.review_count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: note.avg_rating.toFixed(1),
            reviewCount: note.review_count,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
    category: note.course?.name || 'Medical Education',
    additionalType: 'https://schema.org/DigitalDocument',
  };
}

/** Generate JSON-LD for BreadcrumbList */
export function generateBreadcrumbLD(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Generate FAQ schema for landing page */
export function generateFAQLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are the medical study notes on StethoNotes PDF format?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all study notes on StethoNotes are available as high-quality PDF files that can be downloaded instantly after purchase.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which medical courses are covered on StethoNotes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'StethoNotes covers MBBS, BHMS, BAMS, BSc Nursing, B.Pharma, BPT, and Paramedical courses with subject-specific, topper-curated notes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I access my purchased notes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After purchase, you can download your notes directly from your student dashboard or via the confirmation email. Access is instant.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I sell my notes on StethoNotes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Medical students and toppers can apply to become sellers on StethoNotes, upload their notes, and earn commission on every sale.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are the notes verified by experts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All notes sold on StethoNotes go through an admin review before being published. Only high-quality, exam-relevant content is approved.',
        },
      },
    ],
  };
}
