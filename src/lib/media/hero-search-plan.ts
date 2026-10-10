export const HERO_MEDIA_WORLDS = {
  EVERYDAY_FAMILY: {
    defaultProfile: "organic",
    queries: [
      "family groceries kitchen everyday",
      "home organization household routine",
      "family preparing fresh food",
    ],
  },
  PETS: {
    defaultProfile: "organic",
    queries: [
      "dog playing at home family",
      "pet grooming dog cat",
      "pet food bowl home",
    ],
  },
  BEAUTY_WELLNESS: {
    defaultProfile: "cinematic",
    queries: [
      "skincare self care routine",
      "beauty products bathroom morning",
      "hair care grooming close up",
    ],
  },
  HOME: {
    defaultProfile: "organic",
    queries: [
      "clean organized home kitchen",
      "home storage organization",
      "cozy family living room",
    ],
  },
  MARKET_GROCERY: {
    defaultProfile: "organic",
    queries: [
      "fresh produce harvest farm",
      "farmers market vegetables",
      "fresh fruit kitchen preparation",
    ],
  },
  FASHION_PERFORMANCE: {
    defaultProfile: "kinetic",
    queries: [
      "streetwear fashion movement",
      "running training performance",
      "fabric motion fashion detail",
    ],
  },
  PREMIUM_LUXURY: {
    defaultProfile: "cinematic",
    queries: [
      "premium materials macro detail",
      "luxury interior cinematic detail",
      "craftsmanship hands close up",
    ],
  },
  TECHNOLOGY_CREATOR: {
    defaultProfile: "precision",
    queries: [
      "creator desk setup technology",
      "electronics macro clean technology",
      "gaming creator workspace",
    ],
  },
  SEASONAL_GIFTS: {
    defaultProfile: "kinetic",
    queries: [
      "seasonal gift wrapping family",
      "holiday home celebration detail",
      "summer outdoor family gathering",
    ],
  },
} as const;

export type HeroMediaWorld = keyof typeof HERO_MEDIA_WORLDS;

export function heroQueriesForWorld(world: HeroMediaWorld) {
  return HERO_MEDIA_WORLDS[world].queries;
}
