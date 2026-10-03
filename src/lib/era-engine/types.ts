export type PublicEraMedia = {
  id: number;
  assetType: string;
  mediaUrl: string;
  posterUrl: string | null;
  altText: string;
  brandName: string | null;
  providerSlug: string | null;
};

export type PublicEraProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  niche: string;
  images: string[];
  brandName: string | null;
  commerceModel: string;
  sourceProviderSlug: string | null;
  authorizationState: string;
  imageRightsState: string;
  externalSellerName: string | null;
  role: string;
  position: number;
  curationReason: string;
};

export type PublicEraSection = {
  sectionType: string;
  position: number;
  config: Record<string, unknown>;
};

export type PublicEra = {
  slug: string;
  name: string;
  eyebrow: string;
  story: string;
  kind: string;
  lifecycleState: string;
  isPrimary: boolean;
  startAt: string | null;
  endAt: string | null;
  theme: Record<string, string>;
  media: PublicEraMedia[];
  sections: PublicEraSection[];
  products: PublicEraProduct[];
  publicWatchtowerFacets: string[];
};
