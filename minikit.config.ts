const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: process.env.NEXT_FARCASTER_HEADER,
    payload: process.env.NEXT_FARCASTER_PAYLOAD,
    signature: process.env.NEXT_FARCASTER_SIGNATURE
  },
  miniapp: {
    version: "1",
    name: "Saaty AHP",
    subtitle: "Multi-Criteria Decision Making",
    description: "Make better decisions using the Analytic Hierarchy Process with Saaty's Scale for pairwise comparisons.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "productivity",
    tags: ["decision-making", "ahp", "saaty", "analytics", "productivity"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Make Better Decisions",
    ogTitle: "Saaty AHP - Multi-Criteria Decision Making",
    ogDescription: "Use the Analytic Hierarchy Process to make data-driven decisions through pairwise comparisons.",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

