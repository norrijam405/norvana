export const ACRE_ERA = {
  name: "Acre Era",
  tagline: "Useful things. Fresh finds. Clear reasons.",
  promise:
    "Acre Era is a curated marketplace where everyday goods, local food, and unusual finds earn their place.",
} as const;

export const ACRE_ERA_WORLDS = [
  {
    slug: "market",
    label: "Market",
    eyebrow: "Fresh + local",
    description: "Groceries, farms, growers, makers, and seasonal food.",
    href: "/market",
  },
  {
    slug: "goods",
    label: "Goods",
    eyebrow: "Everyday + useful",
    description: "Home, accessories, tech, lifestyle, and practical products.",
    href: "/shop",
  },
  {
    slug: "local",
    label: "Local",
    eyebrow: "Closer to home",
    description: "Farms, makers, and independent businesses worth knowing.",
    href: "/market#local",
  },
  {
    slug: "finds",
    label: "Finds",
    eyebrow: "Curious + changing",
    description: "Rotating discoveries that are still proving themselves.",
    href: "/#era-drop",
  },
] as const;

export const FARM_FACTS = [
  "Healthy soil can hold more water and support more resilient crops.",
  "Seasonal produce often travels less distance when sourced from nearby growers.",
  "Crop rotation can help replenish soil nutrients and interrupt pest cycles.",
  "Buying from smaller producers can keep more of each sale closer to the people who made or grew it.",
] as const;
